import "server-only";
import { sendEmail } from "@/lib/email";
import { firstNameOf, renderOnboardingEmail, type EmailKey } from "@/lib/onboarding-emails";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 86_400_000;

/** Emails 2–5: day after purchase each one becomes due. */
const SCHEDULE: { key: EmailKey; day: number }[] = [
  { key: "co_pilot", day: 1 },
  { key: "appointment", day: 3 },
  { key: "budget", day: 7 },
  { key: "feedback", day: 10 },
];
/** A missed cron run still sends, up to this many days late. Older emails are skipped, never piled up. */
const CATCH_UP_DAYS = 3;
const LOOKBACK_DAYS = SCHEDULE[SCHEDULE.length - 1].day + CATCH_UP_DAYS + 1;

/**
 * Sends one onboarding email to a user, at most once ever (email_log claims the
 * (user_id, email_key) slot before sending; the claim is released if sending fails).
 * Returns false if it was already sent.
 */
export async function sendOnboardingEmail(userId: string, key: EmailKey): Promise<boolean> {
  const admin = createAdminClient();

  const { data: claimed, error: claimError } = await admin
    .from("email_log")
    .upsert({ user_id: userId, email_key: key }, { onConflict: "user_id,email_key", ignoreDuplicates: true })
    .select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return false; // already sent

  try {
    const [{ data: userRes, error: userError }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    if (userError) throw userError;
    const to = userRes.user?.email;
    if (!to) throw new Error(`user ${userId} has no email`);

    const email = renderOnboardingEmail(key, { firstName: firstNameOf(profile?.full_name), userId });
    await sendEmail({ to, ...email });
    return true;
  } catch (err) {
    await admin.from("email_log").delete().eq("id", claimed[0].id);
    throw err;
  }
}

export type CronSummary = { checked: number; sent: { userId: string; key: EmailKey }[]; failed: number };

/** Daily run: sends at most ONE due email (2–5) per buyer. */
export async function runOnboardingEmails(now = new Date()): Promise<CronSummary> {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS).toISOString();

  // Recent buyers. Their first paid payment is "day 0".
  const { data: paid, error: paidError } = await admin
    .from("payments")
    .select("user_id, created_at")
    .eq("status", "paid")
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (paidError) throw paidError;

  const paidAt = new Map<string, Date>();
  for (const p of paid ?? []) if (!paidAt.has(p.user_id)) paidAt.set(p.user_id, new Date(p.created_at));
  const userIds = [...paidAt.keys()];
  const summary: CronSummary = { checked: userIds.length, sent: [], failed: 0 };
  if (!userIds.length) return summary;

  const [profilesRes, refundsRes, logRes, membersRes] = await Promise.all([
    admin.from("profiles").select("id, has_access, marketing_emails_opt_out").in("id", userIds),
    admin.from("payments").select("user_id").eq("status", "refunded").in("user_id", userIds),
    admin.from("email_log").select("user_id, email_key").in("user_id", userIds),
    admin.from("pregnancy_members").select("owner_id, member_id").or(
      `owner_id.in.(${userIds.join(",")}),member_id.in.(${userIds.join(",")})`,
    ),
  ]);
  for (const r of [profilesRes, refundsRes, logRes, membersRes]) if (r.error) throw r.error;

  const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p]));
  const refunded = new Set((refundsRes.data ?? []).map((r) => r.user_id as string));
  const sentKeys = new Set((logRes.data ?? []).map((l) => `${l.user_id}:${l.email_key}`));
  const inSharedSpace = new Set((membersRes.data ?? []).flatMap((m) => [m.owner_id as string, m.member_id as string]));

  for (const userId of userIds) {
    const profile = profiles.get(userId);
    if (!profile?.has_access || profile.marketing_emails_opt_out || refunded.has(userId)) continue;

    const days = Math.floor((now.getTime() - paidAt.get(userId)!.getTime()) / DAY_MS);
    const due = SCHEDULE.find(
      ({ key, day }) =>
        days >= day &&
        days <= day + CATCH_UP_DAYS &&
        !sentKeys.has(`${userId}:${key}`) &&
        !(key === "co_pilot" && inSharedSpace.has(userId)), // partner already joined
    );
    if (!due) continue;

    try {
      if (await sendOnboardingEmail(userId, due.key)) summary.sent.push({ userId, key: due.key });
    } catch (err) {
      summary.failed++;
      console.error("[onboarding emails] send failed", { userId, key: due.key }, err);
    }
  }
  return summary;
}

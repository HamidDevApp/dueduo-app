import "server-only";
import { sendEmail } from "@/lib/email";
import { pickQuickTask } from "@/lib/first-steps";
import { firstNameOf, renderOnboardingEmail, type EmailKey, type TemplateVars } from "@/lib/onboarding-emails";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { toStateMap, type TaskState } from "@/lib/roadmap";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 86_400_000;

/**
 * email_log key: one per email, except the day-2 email, whose two versions share
 * "day2" so a buyer gets at most one of them, ever.
 */
type LogKey = Exclude<EmailKey, "day2_setup" | "day2_task"> | "day2";

/** Emails after the welcome one: day after purchase each one becomes due. */
const SCHEDULE: { key: LogKey; day: number }[] = [
  { key: "co_pilot", day: 1 },
  { key: "day2", day: 2 },
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
export async function sendOnboardingEmail(
  userId: string,
  key: EmailKey,
  opts: { logKey?: LogKey; vars?: TemplateVars } = {},
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: claimed, error: claimError } = await admin
    .from("email_log")
    .upsert(
      { user_id: userId, email_key: opts.logKey ?? key },
      { onConflict: "user_id,email_key", ignoreDuplicates: true },
    )
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

    const email = renderOnboardingEmail(key, { firstName: firstNameOf(profile?.full_name), userId, vars: opts.vars });
    await sendEmail({ to, ...email });
    return true;
  } catch (err) {
    await admin.from("email_log").delete().eq("id", claimed[0].id);
    throw err;
  }
}

export type CronSummary = { checked: number; sent: { userId: string; key: EmailKey }[]; failed: number };

/** Which day-2 version a buyer gets, if any: no due date → setup; due date but nothing ticked → first task. */
function day2Email(
  dueDate: string | null,
  ticked: boolean,
  states: ReturnType<typeof toStateMap>,
  joinedPartnerName: string | null,
): { key: EmailKey; vars?: TemplateVars } | null {
  if (!dueDate) return { key: "day2_setup" };
  if (ticked) return null;
  const task = pickQuickTask(getPregnancyStatus(dueDate).week, states);
  return { key: "day2_task", vars: { taskTitle: task?.title ?? null, joinedPartnerName } };
}

/** Daily run: sends at most ONE due email per buyer who already got the welcome email. */
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

  const [profilesRes, refundsRes, logRes, membersRes, progressRes, customRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, has_access, marketing_emails_opt_out, due_date, partner_name")
      .in("id", userIds),
    admin.from("payments").select("user_id").eq("status", "refunded").in("user_id", userIds),
    admin.from("email_log").select("user_id, email_key").in("user_id", userIds),
    admin.from("pregnancy_members").select("owner_id, member_id").or(
      `owner_id.in.(${userIds.join(",")}),member_id.in.(${userIds.join(",")})`,
    ),
    admin.from("roadmap_progress").select("user_id, task_key, assignee, completed_at").in("user_id", userIds),
    admin.from("custom_tasks").select("user_id").not("completed_at", "is", null).in("user_id", userIds),
  ]);
  for (const r of [profilesRes, refundsRes, logRes, membersRes, progressRes, customRes]) if (r.error) throw r.error;

  const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p]));
  const refunded = new Set((refundsRes.data ?? []).map((r) => r.user_id as string));
  const sentKeys = new Set((logRes.data ?? []).map((l) => `${l.user_id}:${l.email_key}`));
  const inSharedSpace = new Set((membersRes.data ?? []).flatMap((m) => [m.owner_id as string, m.member_id as string]));
  const hasJoinedPartner = new Set((membersRes.data ?? []).map((m) => m.owner_id as string));
  // Anything ticked in the space (by owner or partner) counts — same rule as the "Your first steps" card.
  const progress = (progressRes.data ?? []) as (TaskState & { user_id: string })[];
  const ticked = new Set([
    ...progress.filter((r) => r.completed_at).map((r) => r.user_id),
    ...(customRes.data ?? []).map((r) => r.user_id as string),
  ]);

  for (const userId of userIds) {
    const profile = profiles.get(userId);
    if (!profile?.has_access || profile.marketing_emails_opt_out || refunded.has(userId)) continue;
    // Only buyers who got the welcome email: anyone who bought before these emails went live is skipped.
    if (!sentKeys.has(`${userId}:welcome`)) continue;

    const days = Math.floor((now.getTime() - paidAt.get(userId)!.getTime()) / DAY_MS);
    const day2 = day2Email(
      profile.due_date,
      ticked.has(userId),
      toStateMap(progress.filter((r) => r.user_id === userId)),
      hasJoinedPartner.has(userId) ? profile.partner_name?.trim() || "your partner" : null,
    );
    const due = SCHEDULE.find(
      ({ key, day }) =>
        days >= day &&
        days <= day + CATCH_UP_DAYS &&
        !sentKeys.has(`${userId}:${key}`) &&
        !(key === "co_pilot" && inSharedSpace.has(userId)) && // partner already joined
        !(key === "day2" && !day2), // set up and already ticked something
    );
    if (!due) continue;

    const email: { key: EmailKey; vars?: TemplateVars } = due.key === "day2" ? day2! : { key: due.key };
    try {
      if (await sendOnboardingEmail(userId, email.key, { logKey: due.key, vars: email.vars })) {
        summary.sent.push({ userId, key: email.key });
      }
    } catch (err) {
      summary.failed++;
      console.error("[onboarding emails] send failed", { userId, key: email.key }, err);
    }
  }
  return summary;
}

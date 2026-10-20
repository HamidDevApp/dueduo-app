import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { sendEmail } from "@/lib/email";
import { renderPackEmail, type PackEmailKey } from "@/lib/pack-emails";
import { SITE } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Free planning pack list: double opt-in, server-only tables (migration 0008). */
const DAY_MS = 86_400_000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export const normalizeEmail = (v: unknown) =>
  typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim()) ? v.trim().toLowerCase() : null;

// ---- Unsubscribe links: HMAC of the subscriber id, keyed with CRON_SECRET -------------------

function sign(id: string): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not set");
  return createHmac("sha256", secret).update(`pack-unsubscribe:${id}`).digest("base64url");
}
export const packUnsubscribeUrl = (id: string) =>
  `${SITE.url}/api/pack/unsubscribe?u=${encodeURIComponent(id)}&t=${sign(id)}`;
export function verifyPackUnsubscribe(id: string, token: string): boolean {
  if (!process.env.CRON_SECRET) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---- Turnstile ---------------------------------------------------------------------------

/** Cloudflare's always-pass test secret, used only outside production when no key is set. */
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<boolean> {
  if (typeof token !== "string" || !token) return false;
  const secret =
    process.env.TURNSTILE_SECRET_KEY || (process.env.VERCEL_ENV === "production" ? "" : TEST_SECRET);
  if (!secret) return false;
  const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) });
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// ---- Sending -------------------------------------------------------------------------------

async function send(sub: { id: string; email: string }, key: PackEmailKey, confirmUrl?: string) {
  const email = renderPackEmail(key, { unsubUrl: key === "confirm" ? null : packUnsubscribeUrl(sub.id), confirmUrl });
  await sendEmail({ to: sub.email, ...email });
}

/** Logs (subscriber, key) before sending so an email never goes twice; releases the claim if sending fails. */
async function sendOnce(sub: { id: string; email: string }, key: PackEmailKey): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pack_email_log")
    .upsert({ subscriber_id: sub.id, email_key: key }, { onConflict: "subscriber_id,email_key", ignoreDuplicates: true })
    .select("subscriber_id");
  if (error) throw error;
  if (!data?.length) return false;
  try {
    await send(sub, key);
    return true;
  } catch (err) {
    await admin.from("pack_email_log").delete().eq("subscriber_id", sub.id).eq("email_key", key);
    throw err;
  }
}

// ---- Flows ---------------------------------------------------------------------------------

/** Sign-up form: create or refresh a pending subscriber and send the confirm email. */
export async function subscribe(email: string, source: string | null): Promise<void> {
  const admin = createAdminClient();
  const { data: existing, error } = await admin
    .from("pack_subscribers")
    .select("id, email, status, confirm_token")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;

  // Already confirmed: just send the pack again (no new confirmation needed).
  if (existing?.status === "confirmed") {
    await send(existing, "delivery");
    return;
  }

  const token = randomBytes(24).toString("base64url");
  const row = existing
    ? (
        await admin
          .from("pack_subscribers")
          .update({ status: "pending", confirm_token: token, unsubscribed_at: null })
          .eq("id", existing.id)
          .select("id, email")
          .single()
      ).data
    : (
        await admin
          .from("pack_subscribers")
          .insert({ email, confirm_token: token, source })
          .select("id, email")
          .single()
      ).data;
  if (!row) throw new Error("could not save subscriber");

  await send(row, "confirm", `${SITE.url}/api/pack/confirm?t=${encodeURIComponent(token)}`);
}

/** Confirm link: mark confirmed and send the pack (once). Returns false for an unknown token. */
export async function confirm(token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("pack_subscribers")
    .select("id, email, status")
    .eq("confirm_token", token)
    .maybeSingle();
  if (!sub) return false;
  if (sub.status !== "confirmed") {
    await admin
      .from("pack_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), unsubscribed_at: null })
      .eq("id", sub.id);
  }
  await sendOnce(sub, "delivery");
  return true;
}

export async function unsubscribe(id: string): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("pack_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** Daily run (with the onboarding cron): at most ONE follow-up per subscriber per run. */
const SCHEDULE: { key: PackEmailKey; day: number }[] = [
  { key: "day2", day: 2 },
  { key: "day5", day: 5 },
  { key: "day9", day: 9 },
];
const CATCH_UP_DAYS = 3;

export async function runPackEmails(now = new Date()): Promise<{ checked: number; sent: number; failed: number }> {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - (9 + CATCH_UP_DAYS + 1) * DAY_MS).toISOString();
  const { data: subs, error } = await admin
    .from("pack_subscribers")
    .select("id, email, confirmed_at")
    .eq("status", "confirmed")
    .gte("confirmed_at", since);
  if (error) throw error;
  const result = { checked: subs?.length ?? 0, sent: 0, failed: 0 };
  if (!subs?.length) return result;

  const { data: logs, error: logError } = await admin
    .from("pack_email_log")
    .select("subscriber_id, email_key")
    .in("subscriber_id", subs.map((s) => s.id));
  if (logError) throw logError;
  const sent = new Set((logs ?? []).map((l) => `${l.subscriber_id}:${l.email_key}`));

  for (const sub of subs) {
    const days = Math.floor((now.getTime() - new Date(sub.confirmed_at!).getTime()) / DAY_MS);
    const due = SCHEDULE.find(({ key, day }) => days >= day && days <= day + CATCH_UP_DAYS && !sent.has(`${sub.id}:${key}`));
    if (!due) continue;
    try {
      if (await sendOnce(sub, due.key)) result.sent++;
    } catch (err) {
      result.failed++;
      console.error("[pack emails] send failed", { id: sub.id, key: due.key }, err);
    }
  }
  return result;
}

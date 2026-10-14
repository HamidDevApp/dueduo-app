import { timingSafeEqual } from "node:crypto";
import { runOnboardingEmails } from "@/lib/onboarding-send";

// Daily Vercel cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  try {
    const summary = await runOnboardingEmails();
    console.log("[cron onboarding-emails]", { checked: summary.checked, sent: summary.sent.length, failed: summary.failed });
    return Response.json({ checked: summary.checked, sent: summary.sent.length, failed: summary.failed });
  } catch (err) {
    console.error("[cron onboarding-emails] run failed", err);
    return new Response("Run failed", { status: 500 });
  }
}

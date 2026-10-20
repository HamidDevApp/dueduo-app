import { timingSafeEqual } from "node:crypto";
import { runOnboardingEmails } from "@/lib/onboarding-send";
import { runPackEmails } from "@/lib/pack";

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
    // Planning pack follow-ups ride on the same daily run; a failure here must not hide the buyer emails' result.
    const pack = await runPackEmails().catch((err) => {
      console.error("[cron pack-emails] run failed", err);
      return null;
    });
    if (pack) console.log("[cron pack-emails]", pack);
    return Response.json({ checked: summary.checked, sent: summary.sent.length, failed: summary.failed, pack });
  } catch (err) {
    console.error("[cron onboarding-emails] run failed", err);
    return new Response("Run failed", { status: 500 });
  }
}

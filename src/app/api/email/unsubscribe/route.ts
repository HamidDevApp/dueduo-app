import { UUID_RE } from "@/lib/form";
import { verifyUnsubscribeToken } from "@/lib/onboarding-emails";
import { SITE } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Unsubscribe from onboarding tips (emails 2–5).
 *   GET  → a confirm page with one button (so link scanners can't unsubscribe people by just opening the link)
 *   POST → sets profiles.marketing_emails_opt_out; also the one-click target of the List-Unsubscribe header
 */
export const dynamic = "force-dynamic";

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title} · DueDuo</title></head>
<body style="margin:0;background:#FBF6F1;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2E2523;">
<main style="max-width:480px;margin:64px auto;padding:0 16px;">
<p style="font:500 24px/1 Georgia,serif;color:#9A4741;margin:0 0 24px;">DueDuo</p>
<h1 style="font:500 26px/1.25 Georgia,serif;margin:0 0 12px;">${title}</h1>
${body}
</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const invalid = () =>
  page("This link doesn't work", `<p>Please email us at ${SITE.supportEmail} and we'll unsubscribe you.</p>`, 400);

function params(req: Request) {
  const u = new URL(req.url);
  const userId = u.searchParams.get("u") ?? "";
  const token = u.searchParams.get("t") ?? "";
  return UUID_RE.test(userId) && verifyUnsubscribeToken(userId, token) ? { userId, token } : null;
}

export async function GET(req: Request) {
  const p = params(req);
  if (!p) return invalid();
  const action = `/api/email/unsubscribe?u=${encodeURIComponent(p.userId)}&t=${encodeURIComponent(p.token)}`;
  return page(
    "Stop the DueDuo tips?",
    `<p>You'll stop getting our onboarding tips by email. Sign-in emails and your plan aren't affected.</p>
<form method="post" action="${action}"><button type="submit" style="margin-top:8px;padding:12px 24px;border:0;border-radius:999px;background:#9A4741;color:#fff;font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;cursor:pointer;">Unsubscribe</button></form>`,
  );
}

export async function POST(req: Request) {
  const p = params(req);
  if (!p) return invalid();

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ marketing_emails_opt_out: true })
    .eq("id", p.userId);
  if (error) {
    console.error("[unsubscribe] update failed", error);
    return page("Something went wrong", `<p>Please try again, or email us at ${SITE.supportEmail}.</p>`, 500);
  }
  return page("You're unsubscribed", "<p>You won't get any more DueDuo tips by email. Your plan stays exactly as it is.</p>");
}

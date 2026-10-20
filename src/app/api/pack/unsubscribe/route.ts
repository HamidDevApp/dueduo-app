import { UUID_RE } from "@/lib/form";
import { unsubscribe, verifyPackUnsubscribe } from "@/lib/pack";
import { SITE } from "@/lib/site-config";
import { simplePage } from "@/lib/simple-page";

/**
 * Unsubscribe from the planning pack emails.
 *   GET  → confirm page with one button (link scanners can't unsubscribe people by opening the link)
 *   POST → unsubscribes; also the one-click target of the List-Unsubscribe header
 */
export const dynamic = "force-dynamic";

function params(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("u") ?? "";
  const token = u.searchParams.get("t") ?? "";
  return UUID_RE.test(id) && verifyPackUnsubscribe(id, token) ? { id, token } : null;
}

const invalid = () =>
  simplePage("This link doesn't work", `<p>Please email us at ${SITE.supportEmail} and we'll unsubscribe you.</p>`, 400);

export async function GET(req: Request) {
  const p = params(req);
  if (!p) return invalid();
  const action = `/api/pack/unsubscribe?u=${encodeURIComponent(p.id)}&t=${encodeURIComponent(p.token)}`;
  return simplePage(
    "Stop the planning emails?",
    `<p>You'll stop getting emails about the DueDuo planning pack.</p>
<form method="post" action="${action}"><button type="submit" style="margin-top:8px;padding:12px 24px;border:0;border-radius:999px;background:#9A4741;color:#fff;font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;cursor:pointer;">Unsubscribe</button></form>`,
  );
}

export async function POST(req: Request) {
  const p = params(req);
  if (!p) return invalid();
  if (!(await unsubscribe(p.id))) {
    return simplePage("Something went wrong", `<p>Please try again, or email us at ${SITE.supportEmail}.</p>`, 500);
  }
  return simplePage("You're unsubscribed", "<p>You won't get any more planning pack emails from us.</p>");
}

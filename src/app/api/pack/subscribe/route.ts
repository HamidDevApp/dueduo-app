import { parseGuideSource } from "@/lib/guides";
import { normalizeEmail, subscribe, verifyTurnstile } from "@/lib/pack";

// Free planning pack sign-up (double opt-in). Needs the consent tick and a Turnstile token.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: unknown; consent?: unknown; token?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) return Response.json({ error: "email" }, { status: 400 });
  if (body.consent !== true) return Response.json({ error: "consent" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(body.token, ip))) return Response.json({ error: "captcha" }, { status: 400 });

  try {
    await subscribe(email, parseGuideSource(body.source));
  } catch (err) {
    console.error("[pack subscribe] failed", err);
    return Response.json({ error: "server" }, { status: 500 });
  }
  // Same answer whether the address was new or known, so the form can't be used to probe the list.
  return Response.json({ ok: true });
}

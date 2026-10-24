import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { simplePage } from "@/lib/simple-page";

/**
 * Sign-in link from the email ({{ .TokenHash }} template).
 * Unlike /auth/callback (PKCE), it works in any browser, so links opened from Mail
 * after signing up in an Instagram or TikTok browser no longer loop back to /login.
 *   GET  → page with one button (email link scanners can't use up the link by opening it)
 *   POST → verifies the token and signs in
 */
export const dynamic = "force-dynamic";

const TOKEN_RE = /^[A-Za-z0-9_-]{10,200}$/;

function params(req: Request) {
  const u = new URL(req.url);
  const tokenHash = u.searchParams.get("token_hash") ?? "";
  const next = u.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return { tokenHash: TOKEN_RE.test(tokenHash) ? tokenHash : null, next: safeNext, origin: u.origin };
}

export async function GET(req: Request) {
  const { tokenHash, next } = params(req);
  if (!tokenHash) return NextResponse.redirect(new URL("/login?error=link", req.url));
  const action = `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(next)}`;
  return simplePage(
    "Sign in to DueDuo",
    `<p>Tap the button to finish signing in.</p>
<form method="post" action="${action}"><button type="submit" style="margin-top:8px;padding:12px 24px;border:0;border-radius:999px;background:#9A4741;color:#fff;font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;cursor:pointer;">Sign in</button></form>`,
  );
}

export async function POST(req: Request) {
  const { tokenHash, next, origin } = params(req);
  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (!error) return NextResponse.redirect(`${origin}${next}`, 303);
  }
  return NextResponse.redirect(`${origin}/login?error=link`, 303);
}

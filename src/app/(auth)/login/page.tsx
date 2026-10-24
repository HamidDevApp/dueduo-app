"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Baby, Mail } from "lucide-react";
import Link from "next/link";
import { Turnstile } from "@/components/auth/turnstile";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/track";
import { SITE } from "@/lib/site-config";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    params.get("error") ? "error" : "idle",
  );
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captchaToken) return;
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        captchaToken,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? SITE.url : window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setState(error ? "error" : "sent");
    if (!error) track("Lead");
    else setCaptchaReset((n) => n + 1); // tokens are single-use
  }

  // The code works in any browser, so it doesn't matter where the email is opened.
  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setCodeError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setVerifying(false);
      setCodeError(true);
      return;
    }
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    window.location.assign(safeNext);
  }

  if (state === "sent") {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <div className="text-center">
          <Mail className="mx-auto size-10 text-brand" />
          <h1 className="mt-4 font-display text-2xl">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a sign-in code to <strong className="text-ink">{email}</strong>. Type it here, or tap the
            button in the email.
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Your code</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-center text-2xl tracking-[0.3em] outline-none focus:border-brand"
            placeholder="123456"
          />
        </label>
        {codeError && (
          <p className="text-sm text-brand-strong" role="alert">
            That code didn&apos;t work. Check the newest email, or send a new code.
          </p>
        )}
        <button
          type="submit"
          disabled={verifying || code.length < 6}
          className="w-full rounded-xl bg-brand-strong px-4 py-3 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
        >
          {verifying ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setCode("");
            setCodeError(false);
            setCaptchaReset((n) => n + 1);
          }}
          className="w-full text-sm text-muted underline underline-offset-2 hover:text-ink"
        >
          Use a different email or send a new code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Baby className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl">Welcome</h1>
        <p className="mt-1 text-sm text-muted">We&apos;ll email you a sign-in code. No password needed.</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand"
          placeholder="you@example.com"
        />
      </label>

      <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

      {state === "error" && (
        <p className="text-sm text-brand-strong" role="alert">
          {params.get("error") === "link" || params.get("error") === "auth"
            ? "That sign-in link has expired or was opened in another browser. Send a new code below."
            : "Something went wrong. Please try again."}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending" || !captchaToken}
        className="w-full rounded-xl bg-brand-strong px-4 py-3 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : captchaToken ? "Email me a code" : "Checking you're human…"}
      </button>

      <p className="text-center text-xs text-muted">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

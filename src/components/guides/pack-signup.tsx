"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@/components/auth/turnstile";

/** "Get all our printables in one PDF": double opt-in sign-up on every guide (approved copy). */
export function PackSignup({ source }: { source?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !token) return;
    setState("sending");
    try {
      const res = await fetch("/api/pack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, token, source }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
    setResetKey((n) => n + 1); // Turnstile tokens are single-use
  }

  return (
    <section
      aria-labelledby={`${id}-h`}
      className="mt-14 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8 print:hidden"
    >
      <h2 id={`${id}-h`} className="font-display text-2xl font-semibold tracking-tight">
        Get all our printables in one PDF
      </h2>
      <p className="mt-2 leading-relaxed text-ink/85">
        The hospital bag checklist, appointment questions, the partner&apos;s list, the baby starter list and the
        who-owns-what sheet. Free, for both of you.
      </p>

      {state === "done" ? (
        <p role="status" className="mt-6 rounded-xl bg-sage-soft p-4 font-semibold text-sage">
          Almost done! Check your inbox and confirm your email to get the pack.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Your email</span>
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
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink/85">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--color-brand-strong)]"
            />
            <span>
              Email me the free pack and a few planning tips from DueDuo. I can unsubscribe anytime. (
              <Link href="/privacy" className="font-semibold text-brand-strong underline underline-offset-2">
                Privacy Policy
              </Link>
              )
            </span>
          </label>
          <Turnstile onToken={setToken} resetKey={resetKey} />
          {state === "error" && (
            <p role="alert" className="text-sm text-brand-strong">
              Something went wrong. Please try again.
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending" || !consent || !token}
            className="inline-flex items-center justify-center rounded-full bg-brand-strong px-6 py-3.5 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send me the pack"}
          </button>
        </form>
      )}
    </section>
  );
}

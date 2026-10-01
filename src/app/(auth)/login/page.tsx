"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Baby, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    params.get("error") ? "error" : "idle",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div className="text-center">
        <Mail className="mx-auto size-10 text-brand" />
        <h1 className="mt-4 font-display text-2xl">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Baby className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl">Welcome</h1>
        <p className="mt-1 text-sm text-muted">Sign in with a magic link — no password needed.</p>
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

      {state === "error" && (
        <p className="text-sm text-brand-strong" role="alert">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send magic link"}
      </button>
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

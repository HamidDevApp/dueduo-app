import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";

export const metadata: Metadata = { title: "Join as Co-Pilot" };

const ERRORS: Record<string, string> = {
  invalid: "This invite link has expired or was already used. Ask for a new one from the Co-Pilot page.",
  own: "This is your own invite link — send it to your partner instead.",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <HeartHandshake className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl">Become the Co-Pilot</h1>
        <p className="mt-2 text-sm text-muted">
          You&apos;ll share the pregnancy plan and get your own list of tasks — bookings, car seat, visitor
          messages and more.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-brand-strong">
            {ERRORS[error] ?? ERRORS.invalid}
          </p>
        )}

        <form action={acceptInvite.bind(null, token)} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong"
          >
            Join the plan
          </button>
        </form>
        <p className="mt-3 text-xs text-muted">
          By joining you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

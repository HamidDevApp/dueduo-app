import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, HeartHandshake, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PayButton } from "@/components/checkout/pay-button";
import { TrackEvent } from "@/components/tracking/track-event";
import { SITE } from "@/lib/site-config";
import { getSpace } from "@/lib/space";
import { startCheckout } from "./actions";

export const metadata: Metadata = { title: "Unlock your planner" };

const INCLUDED = [
  "Week-by-week roadmap — 79 practical tasks",
  "Partner Co-Pilot with their own task list",
  "Doctor visit printout (questions + symptoms)",
  "12 ready-to-send WhatsApp boundary scripts",
  "Smart budget with leave income gap & Skip list",
  "Appointments, registry & hospital bag checklists",
];

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const { canceled } = await searchParams;
  const { role, profile } = await getSpace();

  if (profile?.has_access) redirect(profile.due_date ? "/dashboard" : "/onboarding");

  // Partners never pay — they wait for the owner to unlock the shared plan.
  if (role === "partner") {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
          <HeartHandshake className="mx-auto size-10 text-brand" aria-hidden />
          <h1 className="mt-4 font-display text-2xl">Almost there</h1>
          <p className="mt-2 text-sm text-muted">
            {profile?.full_name || "Your partner"} needs to unlock the planner. As Co-Pilot, you get full access for free
            as soon as they do.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase">{SITE.name}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Unlock your command center</h1>
          <p className="mt-2 text-muted">Everything you need from positive test to delivery day — in one calm place.</p>
        </div>

        {canceled && (
          <p role="status" className="mt-6 rounded-xl bg-canvas p-3 text-center text-sm text-muted">
            No worries — you weren&apos;t charged. You can finish whenever you&apos;re ready.
          </p>
        )}

        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display text-5xl">{SITE.price}</span>
            <span className="text-muted">one-time</span>
          </div>
          <p className="mt-1 text-center text-xs text-muted">{SITE.priceNote}</p>

          <ul className="mt-6 space-y-2.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden /> {item}
              </li>
            ))}
          </ul>

          <TrackEvent event="InitiateCheckout" value={SITE.priceValue} currency={SITE.currency} />
          <form action={startCheckout} className="mt-6">
            <PayButton label={`Unlock for ${SITE.price}`} />
          </form>
          <p className="mt-3 text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{" "}
            <Link href="/refund" className="underline underline-offset-2 hover:text-ink">Refund policy</Link>.
          </p>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4" aria-hidden /> Secure payment by Polar
            {SITE.guaranteeDays ? ` · ${SITE.guaranteeDays}-day money-back guarantee` : ""}
          </p>
        </div>
      </div>
    </main>
  );
}

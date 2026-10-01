# Step 7 — Launch: landing page, $29 checkout, deployment (copy-paste code)

1. Install: `npm i stripe server-only`
2. Run `supabase/migrations/0003_payments.sql` in the Supabase SQL Editor.
3. Paste the **new files** (section A) and **replace** the files in section B.
4. Follow `DEPLOY.md` for Stripe, Supabase SMTP/URLs and Vercel.

## A. New files

### `supabase/migrations/0003_payments.sql`

```sql
-- =========================================================
-- First Pregnancy Planner — 0003: payments
-- Written ONLY by the server (service role) from Stripe events.
-- profiles.has_access (from 0001) is the unlock flag.
-- =========================================================

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text not null unique,
  payment_intent_id text,
  amount_total      integer,               -- in the smallest currency unit (e.g. cents)
  currency          text,
  status            text not null default 'paid' check (status in ('paid','refunded')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.payments (user_id);
create index on public.payments (payment_intent_id);

alter table public.payments enable row level security;

-- Users can see their own receipts; nobody but the server can write.
create policy "payments: read own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.payments from anon, authenticated;
```

### `src/lib/site-config.ts`

```ts
/** Single place for launch copy that must stay in sync with Stripe and your policies. */
export const SITE = {
  name: "First Pregnancy Planner",
  /** Must match the Stripe Price you create (STRIPE_PRICE_ID). */
  price: "$29",
  priceNote: "One-time payment · No subscription · Your partner joins free",
  /** Money-back guarantee shown on the site. Set to null to hide it. Make sure your refund policy matches. */
  guaranteeDays: 14 as number | null,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com",
  /** Tags every Stripe checkout so other products on the same Stripe account are ignored by this app. */
  productKey: "first-pregnancy-planner",
} as const;
```

### `src/lib/supabase/admin.ts`

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses RLS. Use ONLY in trusted server code
 * (Stripe webhook / payment fulfillment). Never import in client components.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

### `src/lib/stripe.ts`

```ts
import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily created so builds don't fail when the key isn't set yet. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key); // uses the API version pinned by the installed SDK
  }
  return client;
}
```

### `src/lib/billing.ts`

```ts
import "server-only";
import type Stripe from "stripe";
import { UUID_RE } from "@/lib/form";
import { SITE } from "@/lib/site-config";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type FulfillResult =
  | { status: "paid"; userId: string }
  | { status: "pending"; userId: string }
  | { status: "invalid" };

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

/**
 * Grants access for a Checkout Session. Idempotent — safe to call from both
 * the webhook and the success page (whichever arrives first wins).
 */
export async function fulfillCheckout(sessionId: string): Promise<FulfillResult> {
  // Always re-fetch from Stripe: never trust data passed in by the browser.
  const session: Stripe.Checkout.Session = await stripe().checkout.sessions.retrieve(sessionId);

  if (session.metadata?.product !== SITE.productKey) return { status: "invalid" };
  const userId = session.client_reference_id;
  if (!userId || !UUID_RE.test(userId)) return { status: "invalid" };

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) return { status: "pending", userId };

  const admin = createAdminClient();

  const { error: payError } = await admin.from("payments").upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      payment_intent_id: idOf(session.payment_intent),
      amount_total: session.amount_total,
      currency: session.currency,
      status: "paid",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );
  if (payError) throw payError;

  const { error } = await admin.from("profiles").update({ has_access: true }).eq("id", userId);
  if (error) throw error;

  return { status: "paid", userId };
}

/** Full refund → mark the payment refunded and remove access. */
export async function revokeForRefund(paymentIntentId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("payment_intent_id", paymentIntentId)
    .select("user_id")
    .maybeSingle();

  if (payment?.user_id) {
    await admin.from("profiles").update({ has_access: false }).eq("id", payment.user_id);
  }
}

export { idOf };
```

### `src/app/api/stripe/webhook/route.ts`

```ts
import type Stripe from "stripe";
import { fulfillCheckout, idOf, revokeForRefund } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

// Stripe needs the raw body to verify the signature — no caching, Node runtime.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckout(event.data.object.id);
        break;

      case "charge.refunded": {
        const charge = event.data.object;
        const pi = idOf(charge.payment_intent);
        if (charge.refunded && pi) await revokeForRefund(pi); // full refunds only
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handling failed", event.type, err);
    return new Response("Handler error", { status: 500 }); // Stripe will retry
  }

  return Response.json({ received: true });
}
```

### `src/app/checkout/actions.ts`

```ts
"use server";

import { redirect } from "next/navigation";
import { SITE } from "@/lib/site-config";
import { siteOrigin } from "@/lib/site";
import { getSpace } from "@/lib/space";
import { stripe } from "@/lib/stripe";

export async function startCheckout() {
  const { user, role, profile } = await getSpace();
  if (role !== "owner") redirect("/dashboard");
  if (profile?.has_access) redirect(profile.due_date ? "/dashboard" : "/onboarding");

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID is not set");

  const origin = await siteOrigin();
  const tag = { product: SITE.productKey, user_id: user.id };

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id, // how the webhook knows who paid
    customer_email: user.email ?? undefined,
    metadata: tag,
    payment_intent_data: { metadata: tag },
    allow_promotion_codes: true,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?canceled=1`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}
```

### `src/app/checkout/page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, HeartHandshake, ShieldCheck } from "lucide-react";
import { PayButton } from "@/components/checkout/pay-button";
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

          <form action={startCheckout} className="mt-6">
            <PayButton label={`Unlock for ${SITE.price}`} />
          </form>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4" aria-hidden /> Secure payment by Stripe
            {SITE.guaranteeDays ? ` · ${SITE.guaranteeDays}-day money-back guarantee` : ""}
          </p>
        </div>
      </div>
    </main>
  );
}
```

### `src/app/checkout/success/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { fulfillCheckout, type FulfillResult } from "@/lib/billing";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Payment received" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id?.startsWith("cs_")) redirect("/checkout");

  const { user, profile } = await getSpace();

  // Don't wait for the webhook: verify with Stripe directly (idempotent).
  let result: FulfillResult | { status: "error" };
  try {
    result = await fulfillCheckout(session_id);
  } catch (err) {
    console.error("[checkout/success] fulfillment failed", err);
    result = { status: "error" };
  }

  if (result.status === "paid" && result.userId === user.id) {
    redirect(profile?.due_date ? "/dashboard" : "/onboarding");
  }

  const pending = result.status === "pending";

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
        {pending ? (
          <>
            <AutoRefresh />
            <Loader2 className="mx-auto size-10 animate-spin text-brand" aria-hidden />
            <h1 className="mt-4 font-display text-2xl">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-muted">This usually takes a few seconds. Please keep this page open.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl">We couldn&apos;t confirm this payment</h1>
            <p className="mt-2 text-sm text-muted">
              If you were charged, don&apos;t worry — access is granted automatically within a few minutes. Try
              refreshing, or contact support.
            </p>
            <Link href="/checkout" className="mt-6 inline-block font-semibold text-brand hover:text-brand-strong">
              Back to checkout
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
```

### `src/components/checkout/pay-button.tsx`

```tsx
"use client";

import { useFormStatus } from "react-dom";
import { Lock } from "lucide-react";

export function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-semibold text-white shadow-sm hover:bg-brand-strong disabled:opacity-70"
    >
      <Lock className="size-4" aria-hidden />
      {pending ? "Opening secure checkout…" : label}
    </button>
  );
}
```

### `src/components/checkout/auto-refresh.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-runs the server page every few seconds (used while a payment is still processing). */
export function AutoRefresh({ everyMs = 3000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}
```

### `src/components/landing/cta-link.tsx`

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Primary CTA: sign up (magic link) → straight to checkout. */
export const CHECKOUT_PATH = "/login?next=/checkout";

export function CtaLink({ children, className, variant = "primary" }: { children: React.ReactNode; className?: string; variant?: "primary" | "light" }) {
  return (
    <Link
      href={CHECKOUT_PATH}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-colors",
        variant === "primary" ? "bg-brand text-white shadow-sm hover:bg-brand-strong" : "bg-white text-brand-strong hover:bg-brand-soft",
        className,
      )}
    >
      {children} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
```

### `src/components/landing/site-header.tsx`

```tsx
import Link from "next/link";
import { Baby } from "lucide-react";
import { SITE } from "@/lib/site-config";
import { CHECKOUT_PATH } from "./cta-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label={SITE.name}>
          <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
            <Baby className="size-4.5" aria-hidden />
          </span>
          <span className="hidden font-display text-lg whitespace-nowrap min-[420px]:inline">{SITE.name}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap">
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
            What&apos;s inside
          </a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
            Pricing
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 text-muted hover:text-ink">
            Log in
          </Link>
          <Link href={CHECKOUT_PATH} className="rounded-lg bg-ink px-3.5 py-2 text-canvas hover:bg-ink/90">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

### `src/components/landing/product-preview.tsx`

```tsx
import { CalendarHeart, Check, HeartHandshake, Luggage, Sparkles } from "lucide-react";

/** A static, illustrative mock of the dashboard — no real user data. */
export function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-soft via-canvas to-sage-soft blur-2xl" />
      <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-xl shadow-ink/5">
        <div className="rounded-2xl border border-line p-4">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-strong">
            <Sparkles className="size-3" /> Trimester 2
          </p>
          <div className="mt-2 flex items-end justify-between">
            <p className="font-display text-4xl">Week 20</p>
            <p className="text-right">
              <span className="block font-display text-2xl text-brand">140</span>
              <span className="text-xs text-muted">days to go</span>
            </p>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-canvas">
            <div className="h-full w-1/2 rounded-full bg-brand" />
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted">This week · Halfway there</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="grid size-4.5 place-items-center rounded-full bg-sage text-white"><Check className="size-3" strokeWidth={3} /></span>
              <span className="text-muted line-through">Book the anatomy scan</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-4.5 rounded-full border-2 border-line" />
              File leave paperwork
              <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-strong">You</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-4.5 rounded-full border-2 border-line" />
              Ask for hand-me-downs
              <span className="ml-auto rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-semibold text-sage">Partner</span>
            </li>
          </ul>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl bg-canvas p-2.5">
            <CalendarHeart className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Scan Fri</p>
          </div>
          <div className="rounded-xl bg-canvas p-2.5">
            <HeartHandshake className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Co-Pilot on</p>
          </div>
          <div className="rounded-xl bg-canvas p-2.5">
            <Luggage className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Bag 6/18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `src/components/landing/sections.tsx`

```tsx
import {
  Check,
  ClipboardList,
  HeartHandshake,
  Luggage,
  Map as MapIcon,
  MessageCircle,
  Printer,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SITE } from "@/lib/site-config";
import { CtaLink } from "./cta-link";
import { ProductPreview } from "./product-preview";

/* ------------------------------ HERO ------------------------------ */

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
      <div>
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">For first-time parents-to-be</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
          Pregnant for the first time? Here&apos;s exactly what happens next.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          A week-by-week command center that tells you what to book, buy and decide — and gives your partner their own
          task list, so you&apos;re never the only one remembering.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CtaLink>Get my planner — {SITE.price}</CtaLink>
          <a href="#features" className="px-2 py-3 text-center text-sm font-semibold text-muted hover:text-ink">
            See what&apos;s inside
          </a>
        </div>
        <p className="mt-4 text-sm text-muted">{SITE.priceNote}</p>
      </div>
      <ProductPreview />
    </section>
  );
}

/* ------------------------------ PROBLEM ------------------------------ */

const PAINS = [
  { title: "Twenty browser tabs, zero plan", body: "Apps tell you your baby is the size of an avocado. Nobody tells you to book the anatomy scan or join the daycare waitlist." },
  { title: "Questions you forget in the room", body: "You think of them at 2am, then blank the moment the doctor asks “any questions?”." },
  { title: "One person carries it all", body: "Appointments, bookings, awkward family messages — the mental load quietly lands on mom." },
  { title: "Money spent on things you don't need", body: "Baby marketing is relentless. Meanwhile, nobody has calculated what maternity leave will cost you." },
];

export function Problem() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">Everyone has advice. Nobody gives you a plan.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PAINS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-canvas p-6">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FEATURES ------------------------------ */

const FEATURES = [
  { icon: MapIcon, title: "Week-by-week roadmap", body: "79 practical tasks across all three trimesters, each with the why, the time it takes and a button that does the next step for you." },
  { icon: HeartHandshake, title: "Partner Co-Pilot", body: "Your partner gets their own login and task list — the car seat, bookings, the visitor messages. Reassign anything with one tap." },
  { icon: Printer, title: "Doctor visit printout", body: "Log symptoms, star your must-ask questions, and print a clean one-page summary before every appointment." },
  { icon: MessageCircle, title: "Boundary scripts", body: "12 ready-to-send WhatsApp messages: telling work, “please don't post yet”, no hospital visitors, and more." },
  { icon: Wallet, title: "Smart budget", body: "See your maternity leave income gap and one calm monthly savings target. The Skip list stops you buying what babies don't need." },
  { icon: Luggage, title: "Bag, registry & appointments", body: "Shared checklists for three hospital bags, a registry you can share on WhatsApp, and every visit in one place." },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">What&apos;s inside</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">Not another journal. A done-for-you command center.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ------------------------------ */

const STEPS = [
  { title: "Sign up in a minute", body: "Enter your email — no password to remember — and unlock the planner." },
  { title: "Add your due date", body: "Or the first day of your last period. We map every week from today to delivery day." },
  { title: "Invite your partner", body: "Send one WhatsApp link. From then on, you both just open “This week”." },
];

export function HowItWorks() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl">Set up in two minutes</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="grid size-10 place-items-center rounded-full bg-ink font-display text-lg text-canvas">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------ CO-PILOT BAND ------------------------------ */

export function CoPilotBand() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 rounded-[2rem] bg-ink p-8 text-canvas sm:p-12 lg:grid-cols-2">
          <div>
            <HeartHandshake className="size-10 text-brand-soft" aria-hidden />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">You&apos;re a team. Now the plan knows it too.</h2>
            <p className="mt-4 text-canvas/75">
              About a third of the roadmap is assigned to your partner by default — and they see it on their own phone.
              Less “did you remember…?”, more “already done”.
            </p>
          </div>
          <ul className="space-y-3">
            {["Books the scans and the hospital tour", "Installs the car seat and packs their bag", "Sends the “no visitors yet” message for you", "Their own login — free with your plan"].map((t) => (
              <li key={t} className="flex gap-3 rounded-xl bg-canvas/10 p-4">
                <Check className="mt-0.5 size-5 shrink-0 text-brand-soft" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ PRICING ------------------------------ */

const INCLUDED = [
  "Full week-by-week roadmap (all trimesters)",
  "Partner Co-Pilot account included",
  "Doctor visit printouts",
  "12 WhatsApp boundary scripts",
  "Smart budget, leave plan & Skip list",
  "Appointments, registry & hospital bags",
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-3xl sm:text-4xl">One price. Everything included.</h2>
          <p className="mt-3 text-muted">Less than a single maternity outfit — for nine calmer months.</p>
        </div>
        <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-line bg-canvas p-8 shadow-sm">
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display text-6xl">{SITE.price}</span>
            <span className="text-muted">one-time</span>
          </div>
          <p className="mt-1 text-center text-sm text-muted">No subscription. Your partner joins free.</p>
          <ul className="mt-8 space-y-3">
            {INCLUDED.map((i) => (
              <li key={i} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden /> {i}
              </li>
            ))}
          </ul>
          <CtaLink className="mt-8 w-full">Get my planner</CtaLink>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4" aria-hidden /> Secure checkout by Stripe
            {SITE.guaranteeDays ? ` · ${SITE.guaranteeDays}-day money-back guarantee` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FAQ ------------------------------ */

const FAQ = [
  { q: "Is this medical advice?", a: "No. It's an organization tool that helps you plan, prepare questions and share the load. Always follow your doctor or midwife — the planner even helps you ask them better questions." },
  { q: "I'm already 20 weeks. Is it too late?", a: "Not at all. You'll start at your current week, and a gentle “catch up” list shows anything from earlier weeks that still applies." },
  { q: "Does my partner need to pay?", a: "No. You send one invite link and they get their own free login to the same plan." },
  { q: "Is it a subscription?", a: `No — it's a single payment of ${SITE.price}. No renewals, no surprise charges.` },
  { q: "Do I need to download an app?", a: "No. It works in any browser on your phone or computer. Tip: add it to your home screen for one-tap access." },
  { q: "Who can see my information?", a: "Only you and the partner you invite. Your data is never sold or shared." },
];

export function Faq() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl sm:text-4xl">Questions, answered</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FINAL CTA + FOOTER ------------------------------ */

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand px-6 py-14 text-center text-white sm:px-12">
        <ClipboardList className="mx-auto size-10 text-white/80" aria-hidden />
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl sm:text-4xl">
          Know exactly what to do this week — and who&apos;s doing it.
        </h2>
        <CtaLink variant="light" className="mt-8">
          Get my planner — {SITE.price}
        </CtaLink>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {SITE.name}. For organization only — not medical advice.
        </p>
        <nav className="flex gap-4">
          <a href={`mailto:${SITE.supportEmail}`} className="hover:text-ink">
            Contact
          </a>
          <a href="/login" className="hover:text-ink">
            Log in
          </a>
        </nav>
      </div>
    </footer>
  );
}
```

### `src/app/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";

export const alt = "First Pregnancy Planner — know exactly what happens next";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card for Facebook, WhatsApp, TikTok and iMessage links. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #faf6f2 0%, #f7e6e2 60%, #e6efe8 100%)",
          color: "#2b2320",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#c0615a", letterSpacing: 2 }}>FIRST PREGNANCY PLANNER</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 24, maxWidth: 1000 }}>
          Pregnant for the first time? Here&apos;s exactly what happens next.
        </div>
        <div style={{ fontSize: 32, marginTop: 32, color: "#7a6d66" }}>
          Week-by-week plan · Partner Co-Pilot · One-time $29
        </div>
      </div>
    ),
    size,
  );
}
```

## B. Replaced files (full new versions)

### `src/app/page.tsx`

```tsx
import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import {
  CoPilotBand,
  Faq,
  Features,
  FinalCta,
  Hero,
  HowItWorks,
  Pricing,
  Problem,
  SiteFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: { absolute: "First Pregnancy Planner — know exactly what happens next" },
  description:
    "Pregnant for the first time? A week-by-week command center for you and your partner: roadmap, appointments, doctor questions, budget, registry and hospital bag. One-time $29.",
  openGraph: {
    title: "Pregnant for the first time? Here's exactly what happens next.",
    description: "The week-by-week pregnancy command center for you and your partner.",
    type: "website",
  },
};

// Fully static: fast to load from ads, great for SEO.
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <CoPilotBand />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
```

### `src/lib/space.ts`

```ts
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SpaceRole = "owner" | "partner";

export type SpaceProfile = {
  id: string;
  full_name: string | null;
  partner_name: string | null;
  hospital_name: string | null;
  due_date: string | null;
  currency: string;
  mom_monthly_income: number | null;
  partner_monthly_income: number | null;
  mom_leave_weeks: number | null;
  mom_paid_weeks: number | null;
  mom_leave_pay_percent: number | null;
  partner_leave_weeks: number | null;
  work_status: "not_yet" | "told" | "not_applicable";
  visitor_policy: "welcome" | "limited" | "none_first_weeks";
  onboarded_at: string | null;
  has_access: boolean;
};

const PROFILE_COLUMNS =
  "id, full_name, partner_name, hospital_name, due_date, currency, mom_monthly_income, partner_monthly_income, mom_leave_weeks, mom_paid_weeks, mom_leave_pay_percent, partner_leave_weeks, work_status, visitor_policy, onboarded_at, has_access";

/**
 * The pregnancy space the signed-in user works in.
 * Owners see their own space; partners see the space they joined.
 * Cached per request, so layouts and pages can both call it for free.
 */
export const getSpace = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("pregnancy_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .maybeSingle();

  const ownerId: string = membership?.owner_id ?? user.id;
  const role: SpaceRole = membership ? "partner" : "owner";

  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", ownerId).single();
  const profile = data as SpaceProfile | null;

  return { supabase, user, ownerId, role, profile };
});
```

### `src/app/(app)/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, profile } = await getSpace();

  // Paywall: the owner's payment unlocks the whole shared space (partners included).
  if (!profile?.has_access) redirect("/checkout");

  // The owner finishes onboarding first. Partners always join an onboarded space.
  if (!profile?.due_date) {
    if (role === "owner") redirect("/onboarding");
  }

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const name = role === "owner" ? profile?.full_name : profile?.partner_name;

  return (
    <div className="min-h-dvh">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Topbar name={name ?? null} status={status} />
        </div>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
```

### `src/app/onboarding/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { PREGNANCY_DAYS, addDays, isoToday } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Set up your plan" };

export default async function OnboardingPage() {
  const { role, profile } = await getSpace();
  if (role === "partner") redirect("/dashboard"); // only the owner sets up the space
  if (!profile?.has_access) redirect("/checkout");

  const today = isoToday();
  const limits = {
    due: { min: addDays(today, -14), max: addDays(today, PREGNANCY_DAYS) },
    lmp: { min: addDays(today, -(PREGNANCY_DAYS + 14)), max: today },
  };

  const isEditing = Boolean(profile?.due_date);

  return (
    <main className="min-h-dvh px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Baby className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">
            {isEditing ? "Update your plan" : "Let’s build your plan"}
          </h1>
          <p className="mt-2 text-muted">
            Two minutes now, and we&apos;ll handle the what, when and who for the next nine months.
          </p>
        </div>

        <OnboardingWizard
          limits={limits}
          defaults={{
            dueDate: profile?.due_date ?? "",
            fullName: profile?.full_name ?? "",
            partnerName: profile?.partner_name ?? "",
            hospitalName: profile?.hospital_name ?? "",
            currency: profile?.currency ?? "USD",
            momIncome: profile?.mom_monthly_income?.toString() ?? "",
            partnerIncome: profile?.partner_monthly_income?.toString() ?? "",
            leaveWeeks: profile?.mom_leave_weeks?.toString() ?? "",
            paidWeeks: profile?.mom_paid_weeks?.toString() ?? "",
            payPercent: profile?.mom_leave_pay_percent?.toString() ?? "",
            partnerLeaveWeeks: profile?.partner_leave_weeks?.toString() ?? "",
            workStatus: profile?.work_status ?? "not_yet",
            visitorPolicy: profile?.visitor_policy ?? "limited",
          }}
        />

        {isEditing && (
          <p className="mt-6 text-center text-sm">
            <Link href="/dashboard" className="font-semibold text-brand hover:text-brand-strong">
              ← Back to dashboard
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
```

### `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard", "/roadmap", "/appointments", "/questions",
  "/budget", "/registry", "/hospital-bag", "/settings", "/onboarding", "/co-pilot",
  "/checkout",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not put code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
```

### `src/middleware.ts`

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

### `.env.local.example`

```bash
# --- Supabase (Project Settings → API) ---
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
# Publishable key (sb_publishable_...) or legacy anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-KEY
# Secret key (sb_secret_...) or legacy service_role key — SERVER ONLY, never NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=YOUR-SECRET-KEY

# --- Site ---
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_SUPPORT_EMAIL=hello@yourdomain.com

# --- Stripe (Developers → API keys / Webhooks; Product catalog → Price ID) ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```


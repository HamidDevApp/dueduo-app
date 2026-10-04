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
    redirect(`${profile?.due_date ? "/dashboard" : "/onboarding"}?purchase=${encodeURIComponent(session_id)}`);
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

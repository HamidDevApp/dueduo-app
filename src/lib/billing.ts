import "server-only";
import type Stripe from "stripe";
import { sendServerPurchase } from "@/lib/capi";
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

  // ignoreDuplicates → the row is only returned the FIRST time (webhook and success page both call this).
  const { data: inserted, error: payError } = await admin
    .from("payments")
    .upsert(
      {
        user_id: userId,
        stripe_session_id: session.id,
        payment_intent_id: idOf(session.payment_intent),
        amount_total: session.amount_total,
        currency: session.currency,
        status: "paid",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    )
    .select("id");
  if (payError) throw payError;

  const { error } = await admin.from("profiles").update({ has_access: true }).eq("id", userId);
  if (error) throw error;

  // Ad reporting: once per purchase, only if the buyer accepted marketing cookies, never for free (100% coupon) orders.
  const m = session.metadata ?? {};
  if (inserted?.length && m.ad_consent === "granted" && (session.amount_total ?? 0) > 0) {
    await sendServerPurchase({
      eventId: session.id,
      userId,
      email: session.customer_details?.email ?? session.customer_email,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "usd").toUpperCase(),
      sourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout`,
      ip: m.ip || undefined,
      userAgent: m.ua || undefined,
      fbp: m.fbp || undefined,
      fbc: m.fbc || undefined,
      ttp: m.ttp || undefined,
      ttclid: m.ttclid || undefined,
    });
  }

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

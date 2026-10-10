import "server-only";
import { sendServerPurchase } from "@/lib/capi";
import { UUID_RE } from "@/lib/form";
import { polarApi, type PolarCheckout, type PolarOrder } from "@/lib/polar";
import { configuredOrigin } from "@/lib/site";
import { SITE } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";

export type FulfillResult =
  | { status: "paid"; userId: string }
  | { status: "pending"; userId: string }
  | { status: "invalid" };

type Metadata = Record<string, string | number | boolean>;

type PaidPurchase = {
  checkoutId: string;
  orderId: string | null;
  userId: string;
  amount: number; // smallest currency unit (cents)
  currency: string;
  email: string | null;
  metadata: Metadata;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

/**
 * Grants access for a paid Polar checkout. Idempotent — safe to call from both
 * the webhook and the success page (whichever arrives first wins).
 *
 * The payments table predates Polar, so its column names say "stripe":
 *   stripe_session_id = Polar checkout id, payment_intent_id = Polar order id.
 */
async function grantAccess(p: PaidPurchase): Promise<void> {
  const admin = createAdminClient();

  // ignoreDuplicates → the row is only returned the FIRST time (webhook and success page both call this).
  const { data: inserted, error: payError } = await admin
    .from("payments")
    .upsert(
      {
        user_id: p.userId,
        stripe_session_id: p.checkoutId,
        payment_intent_id: p.orderId,
        amount_total: p.amount,
        currency: p.currency.toLowerCase(),
        status: "paid",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    )
    .select("id");
  if (payError) throw payError;

  // The success page may have created the row before the order id was known.
  if (!inserted?.length && p.orderId) {
    await admin
      .from("payments")
      .update({ payment_intent_id: p.orderId })
      .eq("stripe_session_id", p.checkoutId)
      .is("payment_intent_id", null);
  }

  const { error } = await admin.from("profiles").update({ has_access: true }).eq("id", p.userId);
  if (error) throw error;

  // Ad reporting: once per purchase, only if the buyer accepted marketing cookies, never for free (100% discount) orders.
  const m = p.metadata;
  if (inserted?.length && m.ad_consent === "granted" && p.amount > 0) {
    await sendServerPurchase({
      eventId: p.checkoutId,
      userId: p.userId,
      email: p.email,
      value: p.amount / 100,
      currency: p.currency.toUpperCase(),
      sourceUrl: `${configuredOrigin() ?? SITE.url}/checkout`,
      ip: str(m.ip),
      userAgent: str(m.ua),
      fbp: str(m.fbp),
      fbc: str(m.fbc),
      ttp: str(m.ttp),
      ttclid: str(m.ttclid),
    });
  }
}

/** Success page: verify the checkout with Polar directly (never trust the browser) and grant access. */
export async function fulfillCheckout(checkoutId: string): Promise<FulfillResult> {
  const checkout = await polarApi<PolarCheckout>(`/v1/checkouts/${encodeURIComponent(checkoutId)}`);

  if (checkout.metadata?.product !== SITE.productKey) return { status: "invalid" };
  const userId = str(checkout.metadata.user_id);
  if (!userId || !UUID_RE.test(userId)) return { status: "invalid" };

  if (checkout.status === "confirmed") return { status: "pending", userId }; // payment still processing
  if (checkout.status !== "succeeded") return { status: "invalid" };

  await grantAccess({
    checkoutId: checkout.id,
    orderId: null,
    userId,
    amount: checkout.total_amount,
    currency: checkout.currency,
    email: checkout.customer_email,
    metadata: checkout.metadata,
  });
  return { status: "paid", userId };
}

/** Is this order for DueDuo? (Other products on the same Polar organization are ignored.) */
function isOurOrder(order: PolarOrder): boolean {
  if (order.metadata?.product) return order.metadata.product === SITE.productKey;
  const productId = process.env.POLAR_PRODUCT_ID;
  return Boolean(productId && order.product_id === productId);
}

/** Finds a Supabase user by email. Only used for orders that didn't come through our checkout (e.g. a Polar link). */
async function userIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

/** Webhook `order.paid`: the payload is already signature-verified. */
export async function fulfillOrder(order: PolarOrder): Promise<void> {
  if (!isOurOrder(order)) return;
  if (!order.checkout_id) {
    console.warn("[billing] order without checkout id, skipped", order.id);
    return;
  }

  let userId = str(order.metadata?.user_id) ?? str(order.customer?.external_id);
  if (!userId && order.customer?.email) userId = (await userIdByEmail(order.customer.email)) ?? undefined;
  if (!userId || !UUID_RE.test(userId)) {
    console.error("[billing] paid order has no matching user", { orderId: order.id, email: order.customer?.email });
    return;
  }

  await grantAccess({
    checkoutId: order.checkout_id,
    orderId: order.id,
    userId,
    amount: order.total_amount,
    currency: order.currency,
    email: order.customer?.email ?? null,
    metadata: order.metadata ?? {},
  });
}

/** Full refund → mark the payment refunded and remove access. */
export async function revokeForRefund(order: PolarOrder): Promise<void> {
  if (order.status !== "refunded" || !isOurOrder(order)) return; // full refunds only

  const admin = createAdminClient();
  const match = order.checkout_id
    ? `stripe_session_id.eq.${order.checkout_id},payment_intent_id.eq.${order.id}`
    : `payment_intent_id.eq.${order.id}`;
  const { data: payments } = await admin
    .from("payments")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .or(match)
    .select("user_id");

  for (const userId of new Set((payments ?? []).map((p) => p.user_id as string))) {
    await admin.from("profiles").update({ has_access: false }).eq("id", userId);
  }
}

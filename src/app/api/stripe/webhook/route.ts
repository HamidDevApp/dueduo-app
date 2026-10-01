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

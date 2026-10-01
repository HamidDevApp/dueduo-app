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

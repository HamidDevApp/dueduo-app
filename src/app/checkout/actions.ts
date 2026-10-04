"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_COOKIE } from "@/lib/consent";
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
  const tag = { product: SITE.productKey, user_id: user.id, ...(await adSignals()) };

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id, // how the webhook knows who paid
    customer_email: user.email ?? undefined,
    metadata: tag,
    payment_intent_data: { metadata: { product: SITE.productKey, user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?canceled=1`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

/**
 * Ad-matching signals, captured ONLY if the visitor accepted marketing cookies.
 * Stored in Stripe metadata so the webhook can send a server-side Purchase event.
 */
async function adSignals(): Promise<Record<string, string>> {
  const jar = await cookies();
  if (jar.get(CONSENT_COOKIE)?.value !== "granted") return { ad_consent: "denied" };

  const h = await headers();
  const clip = (v: string | null | undefined) => (v ? v.slice(0, 450) : "");
  return {
    ad_consent: "granted",
    ip: clip(h.get("x-forwarded-for")?.split(",")[0]?.trim()),
    ua: clip(h.get("user-agent")),
    fbp: clip(jar.get("_fbp")?.value),
    fbc: clip(jar.get("_fbc")?.value),
    ttp: clip(jar.get("_ttp")?.value),
    ttclid: clip(jar.get("dd_ttclid")?.value),
  };
}

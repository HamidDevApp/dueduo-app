"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_COOKIE } from "@/lib/consent";
import { SITE } from "@/lib/site-config";
import { siteOrigin } from "@/lib/site";
import { getSpace } from "@/lib/space";
import { polarApi, type PolarCheckout } from "@/lib/polar";

export async function startCheckout() {
  const { user, role, profile } = await getSpace();
  if (role !== "owner") redirect("/dashboard");
  if (profile?.has_access) redirect(profile.due_date ? "/dashboard" : "/onboarding");

  const productId = process.env.POLAR_PRODUCT_ID;
  if (!productId) throw new Error("POLAR_PRODUCT_ID is not set");

  const origin = await siteOrigin();
  // Copied by Polar onto the order, so the webhook knows who paid and can send the ad Purchase event.
  const tag = { product: SITE.productKey, user_id: user.id, ...(await adSignals()) };

  const checkout = await polarApi<PolarCheckout>("/v1/checkouts/", {
    method: "POST",
    body: {
      products: [productId],
      customer_email: user.email ?? undefined,
      metadata: tag,
      allow_discount_codes: true,
      success_url: `${origin}/checkout/success?checkout_id={CHECKOUT_ID}`,
      return_url: `${origin}/checkout?canceled=1`,
    },
  });

  if (!checkout.url) throw new Error("Polar did not return a checkout URL");
  redirect(checkout.url);
}

/**
 * Ad-matching signals, captured ONLY if the visitor accepted marketing cookies.
 * Stored in Polar checkout metadata so the webhook can send a server-side Purchase event.
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

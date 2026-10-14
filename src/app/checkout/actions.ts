"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_COOKIE } from "@/lib/consent";
import { parseGuideSource } from "@/lib/guides";
import { SITE } from "@/lib/site-config";
import { siteOrigin } from "@/lib/site";
import { getSpace } from "@/lib/space";
import { PolarApiError, polarApi, type PolarCheckout } from "@/lib/polar";

export async function startCheckout(formData: FormData) {
  const { user, role, profile } = await getSpace();
  if (role !== "owner") redirect("/dashboard");
  if (profile?.has_access) redirect(profile.due_date ? "/dashboard" : "/onboarding");

  const productId = process.env.POLAR_PRODUCT_ID;
  if (!productId) throw new Error("POLAR_PRODUCT_ID is not set");

  const origin = await siteOrigin();
  // Which free guide the purchase started from (fixed list only; never blank — Polar rejects empty metadata values).
  const source = parseGuideSource(formData.get("from"));
  // Copied by Polar onto the order, so the webhook knows who paid, which guide it came from, and can send the ad Purchase event.
  const required = { product: SITE.productKey, user_id: user.id, ...(source ? { source } : {}) };
  const base = {
    products: [productId],
    allow_discount_codes: true,
    success_url: `${origin}/checkout/success?checkout_id={CHECKOUT_ID}`,
    return_url: `${origin}/checkout?canceled=1${source ? `&from=${source}` : ""}`,
  };

  let checkout: PolarCheckout;
  try {
    checkout = await polarApi<PolarCheckout>("/v1/checkouts/", {
      method: "POST",
      body: { ...base, customer_email: user.email ?? undefined, metadata: { ...required, ...(await adSignals()) } },
    });
  } catch (err) {
    if (!(err instanceof PolarApiError && err.status === 422)) throw err;
    // Never block a sale on optional extras: retry with only what fulfillment needs (no ad signals, no email prefill).
    console.error("[checkout] Polar rejected the checkout, retrying without extras:", err.body);
    checkout = await polarApi<PolarCheckout>("/v1/checkouts/", {
      method: "POST",
      body: { ...base, metadata: required },
    });
  }

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
  const signals: Record<string, string | undefined> = {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    ua: h.get("user-agent") ?? undefined,
    fbp: jar.get("_fbp")?.value,
    fbc: jar.get("_fbc")?.value,
    ttp: jar.get("_ttp")?.value,
    ttclid: jar.get("dd_ttclid")?.value,
  };

  // Polar metadata values must be non-empty strings of at most 500 characters: drop missing cookies, clip the rest.
  const out: Record<string, string> = { ad_consent: "granted" };
  for (const [key, value] of Object.entries(signals)) {
    if (value) out[key] = value.slice(0, 450);
  }
  return out;
}

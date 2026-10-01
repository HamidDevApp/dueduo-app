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

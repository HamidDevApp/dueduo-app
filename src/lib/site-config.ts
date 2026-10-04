/** Single place for launch copy that must stay in sync with Stripe and your policies. */
export const SITE = {
  name: "DueDuo",
  tagline: "The first pregnancy planner for two",
  domain: "dueduo.com",
  /** Must match the Stripe Price you create (STRIPE_PRICE_ID). */
  price: "$29",
  /** Numeric price + currency for ad conversion events. Keep in sync with `price`. */
  priceValue: 29,
  currency: "USD",
  priceNote: "One-time payment · No subscription · Your partner joins free",
  /** Money-back guarantee shown on the site. Set to null to hide it. Make sure your refund policy matches. */
  guaranteeDays: 14 as number | null,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@dueduo.com",
  /**
   * Legal details shown in the Terms, Privacy and Refund pages.
   * ⚠️ Replace the bracketed values before going live, and have the final texts reviewed.
   */
   legal: {
   operator: "AS ARGANIA SPINOSA",
   address: "Engstringerstrasse, 16 8952-schlieren zurich suisse",
   governingLaw: "Switzerland",
   lastUpdated: "2026-10-04",
 },
  /** Tags every Stripe checkout so other products on the same Stripe account are ignored by this app.
   *  Keep this value unchanged after launch — existing payments are matched on it. */
  productKey: "first-pregnancy-planner",
} as const;

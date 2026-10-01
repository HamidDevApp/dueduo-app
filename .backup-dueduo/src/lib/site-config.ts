/** Single place for launch copy that must stay in sync with Stripe and your policies. */
export const SITE = {
  name: "First Pregnancy Planner",
  /** Must match the Stripe Price you create (STRIPE_PRICE_ID). */
  price: "$29",
  priceNote: "One-time payment · No subscription · Your partner joins free",
  /** Money-back guarantee shown on the site. Set to null to hide it. Make sure your refund policy matches. */
  guaranteeDays: 14 as number | null,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com",
  /** Tags every Stripe checkout so other products on the same Stripe account are ignored by this app. */
  productKey: "first-pregnancy-planner",
} as const;

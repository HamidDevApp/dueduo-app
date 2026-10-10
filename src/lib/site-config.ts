/** Single place for launch copy that must stay in sync with Polar and your policies. */
export const SITE = {
  name: "DueDuo",
  tagline: "The first pregnancy planner for two",
  domain: "dueduo.com",
  /** Production origin. Live links, emails, payment redirects and ad events always use this. */
  url: "https://dueduo.com",
  /** Must match the price of your Polar product (POLAR_PRODUCT_ID). */
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
   * ⚠️ Have the final texts reviewed before going live.
   */
  legal: {
    operator: "DueDuo",
    address: "Engstringerstrasse 16, 8952 Schlieren, Switzerland",
    governingLaw: "Switzerland",
    lastUpdated: "2026-10-09",
  },
  /** Tags every Polar checkout so other products on the same Polar organization are ignored by this app.
   *  Keep this value unchanged after launch — existing payments are matched on it. */
  productKey: "first-pregnancy-planner",
} as const;

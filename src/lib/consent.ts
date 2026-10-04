/* Cookie consent — shared by client components and server code. */

export const CONSENT_COOKIE = "dd_consent";
export type ConsentValue = "granted" | "denied";

/** Fired on window when the user changes their choice. */
export const CONSENT_EVENT = "dd:consent";
/** Fired on window to reopen the banner (e.g. from "Cookie settings" in the footer). */
export const CONSENT_OPEN_EVENT = "dd:consent-open";

const MAX_AGE = 60 * 60 * 24 * 180; // 6 months

/* ---------- Browser ---------- */

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`));
  return (match?.[1] as ConsentValue) ?? null;
}

export function writeConsent(value: ConsentValue) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

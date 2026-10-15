/**
 * Which ad or post a sale came from, from the landing link's UTM tags:
 * utm_source / utm_campaign / utm_content → one short label, e.g. "meta/launch/reel8" or "pinterest/guides/pin6".
 * "Start our plan" buttons pass it to checkout (`utm=<label>`) → Polar metadata → payments.utm.
 * No cookies or storage: if the visitor wanders to other pages first, the label is simply not passed on.
 */
const PART_RE = /^[a-z0-9_-]{1,40}$/;
const LABEL_RE = /^[a-z0-9_-]{1,40}(\/[a-z0-9_-]{1,40}){0,2}$/;

/** A valid label ("source[/campaign[/content]]", only a–z, 0–9, _ and -), or null. */
export function parseUtmLabel(value: unknown): string | null {
  return typeof value === "string" && value.length <= 122 && LABEL_RE.test(value) ? value : null;
}

/** Label from a landing URL's query string; null without a valid utm_source. Invalid campaign/content parts are dropped. */
export function utmLabelFromSearch(search: string): string | null {
  const q = new URLSearchParams(search);
  const part = (k: string) => {
    const v = (q.get(k) ?? "").trim().toLowerCase();
    return PART_RE.test(v) ? v : null;
  };
  const source = part("utm_source");
  if (!source) return null;
  const campaign = part("utm_campaign");
  const content = part("utm_content");
  return [source, campaign ?? (content ? "-" : null), content].filter(Boolean).join("/");
}

/** Sign-up link that lands on checkout, carrying the guide name and/or UTM label when known. */
export function checkoutPath({ from, utm }: { from?: string | null; utm?: string | null } = {}): string {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (utm) q.set("utm", utm);
  return q.size ? `/login?next=${encodeURIComponent(`/checkout?${q}`)}` : "/login?next=/checkout";
}

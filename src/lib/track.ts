/* Client-side ad events. Safe to call anytime: events wait in a queue until the
   pixels are loaded, and are dropped if the visitor never gives consent. */

export type TrackEvent = "Lead" | "InitiateCheckout" | "Purchase";

type TrackOptions = { eventId?: string; value?: number; currency?: string };

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
type Ttq = { track: (...args: unknown[]) => void; page: () => void; revokeConsent?: () => void };

declare global {
  interface Window {
    fbq?: Fbq;
    ttq?: Ttq;
    __ddPixelsReady?: boolean;
  }
}

/** TikTok uses different standard event names. */
const TIKTOK_EVENT: Record<TrackEvent, string> = {
  Lead: "SubmitForm",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

const queue: [TrackEvent, TrackOptions][] = [];

function send(event: TrackEvent, opts: TrackOptions) {
  const money = opts.value != null ? { value: opts.value, currency: opts.currency ?? "USD" } : {};
  // Same event ID as the server-side event, so Meta/TikTok count a purchase once.
  window.fbq?.("track", event, money, opts.eventId ? { eventID: opts.eventId } : undefined);
  window.ttq?.track(
    TIKTOK_EVENT[event],
    { ...money, content_type: "product", content_id: "dueduo" },
    opts.eventId ? { event_id: opts.eventId } : undefined,
  );
}

export function track(event: TrackEvent, opts: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  if (window.__ddPixelsReady) send(event, opts);
  else queue.push([event, opts]);
}

/** Called by <Pixels /> once the scripts are initialised. */
export function flushTrackQueue() {
  while (queue.length) {
    const [event, opts] = queue.shift()!;
    send(event, opts);
  }
}

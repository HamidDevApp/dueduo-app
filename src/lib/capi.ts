import "server-only";
import { createHash } from "node:crypto";
import { SITE } from "@/lib/site-config";

/** Meta Graph API version used for the Conversions API. */
const META_API_VERSION = "v25.0";

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type PurchaseSignal = {
  eventId: string; // = Stripe Checkout Session id (same as the browser event → deduplicated)
  userId: string;
  email?: string | null;
  value: number;
  currency: string;
  sourceUrl: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  ttp?: string;
  ttclid?: string;
};

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body), // undefined fields are dropped automatically
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

async function sendMeta(s: PurchaseSignal) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixel || !token) return;

  await post(`https://graph.facebook.com/${META_API_VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: s.eventId,
        action_source: "website",
        event_source_url: s.sourceUrl,
        user_data: {
          em: s.email ? [sha256(s.email)] : undefined,
          external_id: [sha256(s.userId)],
          client_ip_address: s.ip,
          client_user_agent: s.userAgent,
          fbp: s.fbp,
          fbc: s.fbc,
        },
        custom_data: { value: s.value, currency: s.currency, content_type: "product", content_ids: ["dueduo"] },
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
  });
}

async function sendTikTok(s: PurchaseSignal) {
  const pixel = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const token = process.env.TIKTOK_EVENTS_ACCESS_TOKEN;
  if (!pixel || !token) return;

  await post(
    "https://business-api.tiktok.com/open_api/v1.3/event/track/",
    {
      event_source: "web",
      event_source_id: pixel,
      data: [
        {
          event: "CompletePayment",
          event_time: Math.floor(Date.now() / 1000),
          event_id: s.eventId,
          user: {
            email: s.email ? sha256(s.email) : undefined,
            external_id: sha256(s.userId),
            ip: s.ip,
            user_agent: s.userAgent,
            ttp: s.ttp,
            ttclid: s.ttclid,
          },
          page: { url: s.sourceUrl },
          properties: {
            currency: s.currency,
            value: s.value,
            content_type: "product",
            contents: [{ content_id: "dueduo", content_name: SITE.name, quantity: 1, price: s.value }],
          },
        },
      ],
      test_event_code: process.env.TIKTOK_TEST_EVENT_CODE || undefined,
    },
    { "Access-Token": token },
  );
}

/** Never throws: ad reporting must not break payment fulfillment. */
export async function sendServerPurchase(signal: PurchaseSignal) {
  const results = await Promise.allSettled([sendMeta(signal), sendTikTok(signal)]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[capi] ${i === 0 ? "Meta" : "TikTok"} purchase event failed`, r.reason);
  });
}

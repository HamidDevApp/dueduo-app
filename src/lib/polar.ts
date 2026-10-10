import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Polar API client (no SDK needed).
 * POLAR_SERVER=sandbox while testing, unset (production) when live.
 */
const API_BASE = process.env.POLAR_SERVER === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";

/** Fields we read from Polar objects (snake_case, as the API returns them). */
type Metadata = Record<string, string | number | boolean>;

export type PolarCheckout = {
  id: string;
  url: string;
  status: "open" | "expired" | "confirmed" | "succeeded" | "failed";
  total_amount: number;
  currency: string;
  customer_email: string | null;
  metadata: Metadata;
};

export type PolarOrder = {
  id: string;
  status: "draft" | "pending" | "paid" | "refunded" | "partially_refunded" | "void";
  paid: boolean;
  total_amount: number;
  currency: string;
  checkout_id: string | null;
  product_id: string | null;
  metadata: Metadata;
  customer: { email: string | null; external_id?: string | null };
};

export async function polarApi<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not set");

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Polar ${init.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Polar webhooks follow the Standard Webhooks spec: HMAC-SHA256 over `${id}.${timestamp}.${body}`. */
const TOLERANCE_SECONDS = 300;

export function verifyPolarWebhook(body: string, headers: Headers, secret: string): boolean {
  const id = headers.get("webhook-id");
  const timestamp = Number(headers.get("webhook-timestamp"));
  const signatures = headers.get("webhook-signature");
  if (!secret || !id || !signatures || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  // Polar signs with the secret's raw bytes; also accept a base64 (whsec_…) secret like the official SDK does.
  const keys = [Buffer.from(secret, "utf8"), Buffer.from(secret.replace(/^whsec_/, ""), "base64")].filter((k) => k.length);
  const signed = `${id}.${Math.floor(timestamp)}.${body}`;

  for (const entry of signatures.split(" ")) {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) continue;
    const given = Buffer.from(sig, "base64");
    for (const key of keys) {
      const expected = createHmac("sha256", key).update(signed).digest();
      if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
    }
  }
  return false;
}

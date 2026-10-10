import { headers } from "next/headers";
import { SITE } from "@/lib/site-config";

/**
 * Origin known without a request: always https://dueduo.com in production,
 * otherwise NEXT_PUBLIC_SITE_URL (local dev / previews), else null.
 */
export function configuredOrigin(): string | null {
  if (process.env.VERCEL_ENV === "production") return SITE.url;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || null;
}

/** Absolute site origin for links shared outside the app (e.g. WhatsApp, payment redirects). */
export async function siteOrigin(): Promise<string> {
  const configured = configuredOrigin();
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

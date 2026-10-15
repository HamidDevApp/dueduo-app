// Shared-secret and IP checks for the poll and MCP endpoints.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const digest = (s: string) => createHash("sha256").update(s).digest();

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** Accepts "Authorization: Bearer <key>" or "?key=<key>" (claude.ai custom connectors can't always send headers). */
export function hasKey(request: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const query = new URL(request.url).searchParams.get("key") ?? "";
  return (!!bearer && safeEqual(bearer, expected)) || (!!query && safeEqual(query, expected));
}

export function clientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || undefined;
}

function ipv4ToInt(ip: string): number | undefined {
  const parts = ip.split(".");
  if (parts.length !== 4) return undefined;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!/^\d+$/.test(p) || v > 255) return undefined;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

/** IPv4 CIDR match. An empty allow list allows everyone. */
export function ipAllowed(ip: string | undefined, cidrs: string[]): boolean {
  if (!cidrs.length) return true;
  const addr = ip ? ipv4ToInt(ip.replace(/^::ffff:/, "")) : undefined;
  if (addr === undefined) return false;
  return cidrs.some((c) => {
    const [base, bitsRaw] = c.split("/");
    const b = ipv4ToInt(base);
    const bits = Number(bitsRaw ?? 32);
    if (b === undefined || !(bits >= 0 && bits <= 32)) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (addr & mask) === (b & mask);
  });
}

/** Meta signs webhook bodies with the app secret: X-Hub-Signature-256: sha256=<hex>. */
export function validMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(header.slice(7), expected);
}

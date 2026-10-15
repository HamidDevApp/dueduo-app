// Web-standard request handlers (Request in, Response out). The Next.js route files call these; so do the tests.

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { clientIp, hasKey, ipAllowed, validMetaSignature } from "./auth";
import { getContext, type InstagramContext } from "./context";
import { createInstagramMcpServer } from "./mcp";
import type { Outcome } from "./engine";
import { GraphError } from "./graph";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** Before the Meta token is in place the routes answer 503 instead of crashing. */
function setUp(ctx?: InstagramContext): InstagramContext | Response {
  if (ctx) return ctx;
  try {
    return getContext();
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Instagram is not set up" }, 503);
  }
}

/** MCP over Streamable HTTP, stateless: a fresh server per request, JSON responses (fits serverless). */
export async function handleMcp(request: Request, given?: InstagramContext): Promise<Response> {
  const ctx = setUp(given);
  if (ctx instanceof Response) return ctx;
  if (!ctx.cfg.mcpKey) return json({ error: "IG_MCP_KEY is not set" }, 503);
  if (!ipAllowed(clientIp(request), ctx.cfg.mcpAllowedCidrs)) return json({ error: "forbidden" }, 403);
  if (!hasKey(request, ctx.cfg.mcpKey)) return json({ error: "unauthorized" }, 401);
  const server = createInstagramMcpServer(ctx);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}

let lastPrune = 0;

/** Called every few minutes by a scheduler (cron-job.org, or Vercel Cron on a Pro plan). */
export async function handlePoll(request: Request, given?: InstagramContext): Promise<Response> {
  const ctx = setUp(given);
  if (ctx instanceof Response) return ctx;
  if (!hasKey(request, ctx.cfg.pollKey)) return json({ error: "unauthorized" }, 401);
  let r;
  try {
    r = await ctx.engine.scan();
  } catch (err) {
    // An expired token or an Instagram outage: say so to the scheduler (it shows the status) without the token.
    const error = err instanceof GraphError ? err.toJSON() : { error: err instanceof Error ? err.message : String(err) };
    console.error(JSON.stringify({ src: "instagram", event: "scan_failed", ...error }));
    return json(error, 502);
  }
  if (Date.now() - lastPrune > 86400000) {
    lastPrune = Date.now();
    await ctx.store.prune(365).catch((err) => console.error(JSON.stringify({ src: "instagram", event: "prune_failed", error: String(err) })));
  }
  // IDs and counts only: no usernames or comment text in logs or responses.
  return json({
    autopilot: r.autopilot,
    posts_scanned: r.posts_scanned,
    comments_scanned: r.comments_scanned,
    sent: r.sent.length,
    would_send: r.would_send.length,
    failed: r.failed.map((f) => ({ comment_id: f.comment_id, trigger: (f as { trigger?: string }).trigger, error: (f as { error?: string }).error })),
    skipped: r.skipped,
    stopped_at_cap: r.stopped_at_cap,
  });
}

/** Meta's webhook verification handshake. */
export function handleWebhookVerify(request: Request, given?: InstagramContext): Response {
  const ctx = setUp(given);
  if (ctx instanceof Response) return ctx;
  const p = new URL(request.url).searchParams;
  const expected = ctx.cfg.webhookVerifyToken;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("forbidden", { status: 403 });
}

type CommentValue = { id?: string; comment_id?: string; text?: string; from?: { id?: string; username?: string }; media?: { id?: string } };

type Change = { field?: string; value?: CommentValue };
type Entry = { changes?: Change[]; field?: string; value?: CommentValue };

/** Pulls comment events out of both payload shapes Meta documents (entry.changes[] and entry.field/value). */
export function commentEvents(payload: unknown): CommentValue[] {
  const out: CommentValue[] = [];
  const entries = (payload as { entry?: Entry[] } | null)?.entry;
  for (const entry of Array.isArray(entries) ? entries : []) {
    const changes: Change[] = Array.isArray(entry?.changes) ? entry.changes : entry?.field ? [{ field: entry.field, value: entry.value }] : [];
    for (const ch of changes) if (ch?.field === "comments" && ch.value) out.push(ch.value);
  }
  return out;
}

/** Comment webhooks need Advanced Access; until then the poller does this job. Both share the engine and its records. */
export async function handleWebhookEvent(request: Request, given?: InstagramContext): Promise<Response> {
  const ctx = setUp(given);
  if (ctx instanceof Response) return ctx;
  if (!ctx.cfg.appSecret) return json({ error: "IG_APP_SECRET is not set" }, 503);
  const raw = await request.text();
  if (!validMetaSignature(raw, request.headers.get("x-hub-signature-256"), ctx.cfg.appSecret)) return json({ error: "bad signature" }, 401);
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const outcomes: Outcome["kind"][] = [];
  for (const v of commentEvents(payload)) {
    const id = v.id ?? v.comment_id;
    if (!id || !v.media?.id) continue;
    try {
      const o = await ctx.engine.handleComment({ id, mediaId: v.media.id, text: v.text, username: v.from?.username, fromId: v.from?.id });
      outcomes.push(o.kind);
    } catch (err) {
      // Still answer 200: Meta retries failed deliveries for up to 36 hours, and the poller is the safety net.
      console.error(JSON.stringify({ src: "instagram", event: "webhook_error", comment_id: id, error: err instanceof Error ? err.message : String(err) }));
    }
  }
  return json({ ok: true, handled: outcomes.length, outcomes });
}

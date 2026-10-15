// The MCP server Claude connects to. Read tools are always on; write tools (reply, hide, DM, publish)
// are refused unless IG_ALLOW_WRITES=true, and Claude still asks the owner before using them.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as ig from "./api";
import { GraphError } from "./graph";
import { createEngine } from "./engine";
import type { ActionStore } from "./store";
import { matchTrigger, validateTriggers } from "./triggers";
import type { InstagramContext } from "./context";

const INSTRUCTIONS = `Tools for DueDuo's Instagram account (@dueduoo).
Rules: never publish a post, send a DM, reply publicly or hide a comment without the owner's yes in the conversation.
The only messages that go out on their own are the fixed trigger texts the owner approved.
Health or medical questions in comments or DMs are flagged for the owner, never answered with advice.
Never invent numbers, quotes or testimonials.`;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };
const ok = (data: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (data: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }], isError: true });

const DAY = 24 * 60 * 60 * 1000;
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}...` : s);

export function createInstagramMcpServer(ctx: InstagramContext) {
  const { cfg, g, store, triggers } = ctx;
  const server = new McpServer({ name: "dueduo-instagram", version: "1.0.0" }, { instructions: INSTRUCTIONS });

  const run = (fn: () => Promise<unknown>) => async (): Promise<ToolResult> => {
    try {
      return ok(await fn());
    } catch (err) {
      return fail(err instanceof GraphError ? err.toJSON() : { error: err instanceof Error ? err.message : String(err) });
    }
  };
  const write = (fn: () => Promise<unknown>) => async (): Promise<ToolResult> => {
    if (!cfg.allowWrites) return fail({ error: "Write tools are off on this server (IG_ALLOW_WRITES is not true). Ask the owner to turn them on." });
    return run(fn)();
  };
  const read = { readOnlyHint: true, openWorldHint: true } as const;
  const act = { readOnlyHint: false, destructiveHint: false, openWorldHint: true } as const;

  server.registerTool(
    "ig_account",
    { title: "Account overview", description: "Username, followers, following and post count of the connected Instagram account.", annotations: read },
    run(() => ig.getAccount(g, cfg.userId)),
  );

  server.registerTool(
    "ig_recent_posts",
    {
      title: "Recent posts",
      description: "Recent posts and Reels with type, date, link, comment and like counts.",
      inputSchema: { days: z.number().int().min(1).max(90).default(14), limit: z.number().int().min(1).max(50).default(25) },
      annotations: read,
    },
    async ({ days, limit }) =>
      run(async () => {
        const cutoff = Date.now() - days * DAY;
        const posts = await ig.listMedia(g, cfg.userId, { limit, maxPages: 2 });
        return posts
          .filter((p) => !p.timestamp || Date.parse(p.timestamp) >= cutoff)
          .map((p) => ({ ...p, caption: clip(p.caption, 140) }));
      })(),
  );

  server.registerTool(
    "ig_comments",
    {
      title: "Comments",
      description:
        "Comments on one post (media_id) or on every post from the last N days, with the trigger word each one matches, whether the account already replied, and the engine's record for it.",
      inputSchema: { media_id: z.string().optional(), days: z.number().int().min(1).max(30).default(7) },
      annotations: read,
    },
    async ({ media_id, days }) =>
      run(async () => {
        const me = await ctx.engine.whoAmI();
        const cutoff = Date.now() - days * DAY;
        const posts = media_id
          ? [{ id: media_id }]
          : (await ig.listMedia(g, cfg.userId, { limit: 25 })).filter(
              (p) => (p.comments_count ?? 0) > 0 && (!p.timestamp || Date.parse(p.timestamp) >= cutoff),
            );
        const actions = new Map((await store.recent(500)).map((a) => [a.comment_id, a]));
        const out = [];
        for (const p of posts) {
          for (const c of await ig.listComments(g, p.id)) {
            const who = c.username ?? c.from?.username;
            const own = !!who && who.toLowerCase() === me.username?.toLowerCase();
            out.push({
              comment_id: c.id,
              media_id: p.id,
              username: who,
              text: clip(c.text, 300),
              timestamp: c.timestamp,
              own_comment: own,
              trigger: own ? undefined : matchTrigger(c.text, p.id, triggers)?.word,
              we_replied: (c.replies?.data ?? []).some((r) => (r.username ?? r.from?.username)?.toLowerCase() === me.username?.toLowerCase()),
              engine: actions.get(c.id)?.status,
            });
          }
        }
        return out;
      })(),
  );

  server.registerTool(
    "ig_trigger_status",
    {
      title: "Trigger engine status",
      description: "The trigger words, their DM and public reply texts, whether autopilot and write tools are on, recent engine actions and any problems with the texts.",
      annotations: read,
    },
    run(async () => ({
      autopilot: cfg.autopilot,
      write_tools: cfg.allowWrites,
      triggers: triggers.map((t) => ({ word: t.word, active: t.active, media_ids: t.mediaIds ?? "any recent post", dm: t.dm, public_replies: t.publicReplies })),
      problems: validateTriggers(triggers),
      recent_actions: await store.recent(25),
    })),
  );

  server.registerTool(
    "ig_trigger_scan",
    {
      title: "Run the trigger scan",
      description:
        "Runs the same scan the poller runs. With send=false (default) it only reports what would be sent. send=true sends the fixed trigger DMs now and needs write tools on.",
      inputSchema: { send: z.boolean().default(false) },
      annotations: act,
    },
    async ({ send }) => {
      if (!send) {
        // Reads the live engine's records (so handled comments are skipped) but writes nothing.
        const readOnly: ActionStore = { handled: (ids) => store.handled(ids), record: async () => {}, recent: (n) => store.recent(n), prune: async () => {} };
        return run(() => createEngine({ g, cfg: { ...cfg, autopilot: false }, store: readOnly, triggers }).scan())();
      }
      return write(() => createEngine({ g, cfg: { ...cfg, autopilot: true }, store, triggers }).scan())();
    },
  );

  server.registerTool(
    "ig_conversations",
    { title: "DM conversations", description: "Recent DM conversations with their last few messages.", inputSchema: { limit: z.number().int().min(1).max(25).default(10) }, annotations: read },
    async ({ limit }) => run(() => ig.listConversations(g, cfg.userId, limit))(),
  );

  server.registerTool(
    "ig_conversation_messages",
    {
      title: "Messages in a conversation",
      description: "The most recent messages (up to 20, an Instagram limit) in one DM conversation.",
      inputSchema: { conversation_id: z.string(), limit: z.number().int().min(1).max(20).default(20) },
      annotations: read,
    },
    async ({ conversation_id, limit }) => run(() => ig.getConversationMessages(g, conversation_id, limit))(),
  );

  server.registerTool(
    "ig_post_insights",
    {
      title: "Post insights",
      description: "Insights for one post or Reel. Default metrics: reach, saved, shares, comments, likes, total_interactions. Add 'views' for Reels.",
      inputSchema: { media_id: z.string(), metrics: z.array(z.string()).optional() },
      annotations: read,
    },
    async ({ media_id, metrics }) => run(() => ig.mediaInsights(g, media_id, metrics?.length ? metrics : ["reach", "saved", "shares", "comments", "likes", "total_interactions"]))(),
  );

  server.registerTool(
    "ig_publishing_limit",
    { title: "Publishing quota", description: "How many API posts the account has used in the last 24 hours.", annotations: read },
    run(() => ig.publishingLimit(g, cfg.userId)),
  );

  // ---- Write tools: the owner says yes in the conversation first ----

  server.registerTool(
    "ig_reply_to_comment",
    { title: "Reply publicly to a comment", description: "Posts a public reply under a comment.", inputSchema: { comment_id: z.string(), message: z.string().min(1).max(2200) }, annotations: act },
    async ({ comment_id, message }) => write(() => ig.replyToComment(g, comment_id, message))(),
  );

  server.registerTool(
    "ig_hide_comment",
    { title: "Hide or show a comment", description: "Hides (hide=true) or shows (hide=false) a comment on the account's own post.", inputSchema: { comment_id: z.string(), hide: z.boolean() }, annotations: act },
    async ({ comment_id, hide }) => write(() => ig.setCommentHidden(g, comment_id, hide))(),
  );

  server.registerTool(
    "ig_send_private_reply",
    {
      title: "DM a commenter",
      description: "Sends the one private reply Instagram allows per comment, within 7 days of the comment. Use only for comments the engine missed or failed on.",
      inputSchema: { comment_id: z.string(), message: z.string().min(1).max(1000) },
      annotations: act,
    },
    async ({ comment_id, message }) =>
      write(async () => {
        const r = await ig.sendPrivateReply(g, cfg.userId, comment_id, message);
        await store.record({ comment_id, media_id: "manual", trigger: "manual", status: "sent" });
        return r;
      })(),
  );

  server.registerTool(
    "ig_send_dm",
    {
      title: "Send a DM",
      description: "Sends a DM to someone who messaged the account in the last 24 hours (Instagram's rule). recipient_id is their Instagram-scoped ID from ig_conversations.",
      inputSchema: { recipient_id: z.string(), message: z.string().min(1).max(1000) },
      annotations: act,
    },
    async ({ recipient_id, message }) => write(() => ig.sendMessage(g, cfg.userId, recipient_id, message))(),
  );

  server.registerTool(
    "ig_create_post",
    {
      title: "Prepare a post",
      description:
        "Creates the upload container for an image (JPEG), carousel (2 to 10 items), Reel or Story from public URLs. Returns a container_id; publish it with ig_publish_post once its status is FINISHED. Nothing appears on Instagram until then.",
      inputSchema: {
        kind: z.enum(["image", "carousel", "reel", "story"]),
        media_urls: z.array(z.string().url()).min(1).max(10),
        caption: z.string().max(2200).optional(),
        share_to_feed: z.boolean().optional(),
        trial_reel: z.boolean().optional().describe("Reels only: show to non-followers first, graduate manually"),
      },
      annotations: act,
    },
    async ({ kind, media_urls, caption, share_to_feed, trial_reel }) =>
      write(async () => {
        const isVideo = (u: string) => /\.(mp4|mov)(\?|$)/i.test(u);
        if (kind === "carousel") {
          if (media_urls.length < 2) throw new Error("A carousel needs 2 to 10 items");
          const children = [];
          for (const u of media_urls) {
            const c = await ig.createContainer(g, cfg.userId, isVideo(u) ? { video_url: u, media_type: "VIDEO", is_carousel_item: true } : { image_url: u, is_carousel_item: true });
            children.push(c.id);
          }
          const parent = await ig.createContainer(g, cfg.userId, { media_type: "CAROUSEL", children: children.join(","), caption });
          return { container_id: parent.id, children, next: "Check status with ig_publish_post when ready" };
        }
        const u = media_urls[0];
        const input =
          kind === "reel"
            ? { media_type: "REELS" as const, video_url: u, caption, share_to_feed, ...(trial_reel ? { trial_params: { graduation_strategy: "MANUAL" as const } } : {}) }
            : kind === "story"
              ? { media_type: "STORIES" as const, ...(isVideo(u) ? { video_url: u } : { image_url: u }) }
              : { image_url: u, caption };
        const c = await ig.createContainer(g, cfg.userId, input);
        return { container_id: c.id, status: (await ig.containerStatus(g, c.id)).status_code };
      })(),
  );

  server.registerTool(
    "ig_publish_post",
    {
      title: "Publish a prepared post",
      description: "Publishes a container from ig_create_post if its status is FINISHED. Videos can take a few minutes to process; if it says IN_PROGRESS, try again later.",
      inputSchema: { container_id: z.string() },
      annotations: act,
    },
    async ({ container_id }) =>
      write(async () => {
        const s = await ig.containerStatus(g, container_id);
        if (s.status_code !== "FINISHED") return { published: false, status_code: s.status_code, status: s.status };
        const media = await ig.publishContainer(g, cfg.userId, container_id);
        const details = await g.get<{ id: string; permalink?: string; timestamp?: string }>(media.id, { fields: "id,permalink,timestamp" }).catch(() => ({ id: media.id }));
        return { published: true, ...details };
      })(),
  );

  return server;
}

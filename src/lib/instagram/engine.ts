// The comment-to-DM engine. It runs without Claude: the poller calls scan() every few minutes and the
// webhook (once Meta grants Advanced Access) calls handleComment() for each new comment.
// It only ever sends the fixed texts in triggers.ts.

import { GraphError, type GraphClient } from "./graph";
import * as ig from "./api";
import type { InstagramConfig } from "./config";
import type { ActionStore } from "./store";
import { matchTrigger, pickPublicReply, type Trigger } from "./triggers";

const DAY = 24 * 60 * 60 * 1000;
const PRIVATE_REPLY_WINDOW = 7 * DAY;

export type IncomingComment = {
  id: string;
  mediaId: string;
  text?: string;
  timestamp?: string;
  username?: string;
  fromId?: string;
  /** Replies already under the comment, when known (the poller knows, the webhook doesn't). */
  replies?: ig.IgComment[];
};

export type Outcome =
  | { kind: "sent"; comment_id: string; media_id: string; trigger: string; public_reply: "posted" | "failed" }
  | { kind: "would_send"; comment_id: string; media_id: string; trigger: string; dm: string; public_reply: string }
  | { kind: "failed"; comment_id: string; media_id: string; trigger: string; error: string }
  | { kind: "skipped"; comment_id: string; reason: "own" | "too_old" | "no_trigger" | "already_handled" };

export type ScanResult = {
  autopilot: boolean;
  posts_scanned: number;
  comments_scanned: number;
  sent: Outcome[];
  would_send: Outcome[];
  failed: Outcome[];
  skipped: Record<string, number>;
  stopped_at_cap: boolean;
};

export type Me = { ids: Set<string>; username?: string };

export function createEngine(deps: {
  g: GraphClient;
  cfg: InstagramConfig;
  store: ActionStore;
  triggers?: Trigger[];
  now?: () => number;
  log?: (event: Record<string, unknown>) => void;
}) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((e) => console.log(JSON.stringify({ src: "instagram", ...e })));
  let me: Me | undefined;

  async function whoAmI(): Promise<Me> {
    if (me) return me;
    const a = await ig.getAccount(deps.g, deps.cfg.userId);
    me = { ids: new Set([a.id, a.user_id, deps.cfg.userId].filter((x): x is string => !!x && x !== "me")), username: a.username };
    return me;
  }

  const isOwn = (m: Me, c: { fromId?: string; username?: string }) =>
    (!!c.fromId && m.ids.has(c.fromId)) || (!!c.username && !!m.username && c.username.toLowerCase() === m.username.toLowerCase());

  async function handleComment(c: IncomingComment, opts: { alreadyHandled?: boolean } = {}): Promise<Outcome> {
    const m = await whoAmI();
    if (isOwn(m, c)) return { kind: "skipped", comment_id: c.id, reason: "own" };
    if (c.timestamp && now() - Date.parse(c.timestamp) > PRIVATE_REPLY_WINDOW) return { kind: "skipped", comment_id: c.id, reason: "too_old" };

    const t = matchTrigger(c.text, c.mediaId, deps.triggers);
    if (!t) return { kind: "skipped", comment_id: c.id, reason: "no_trigger" };

    const repliedPublicly = (c.replies ?? []).some((r) => isOwn(m, { fromId: r.from?.id, username: r.username ?? r.from?.username }));
    const handled = opts.alreadyHandled ?? (await deps.store.handled([c.id])).has(c.id);
    if (repliedPublicly || handled) return { kind: "skipped", comment_id: c.id, reason: "already_handled" };

    const publicReply = pickPublicReply(t, c.id, c.username);
    const base = { comment_id: c.id, media_id: c.mediaId, trigger: t.word };

    if (!deps.cfg.autopilot) {
      await deps.store.record({ ...base, status: "dry_run" });
      return { kind: "would_send", ...base, dm: t.dm, public_reply: publicReply };
    }

    try {
      await ig.sendPrivateReply(deps.g, deps.cfg.userId, c.id, t.dm);
    } catch (err) {
      const error = err instanceof GraphError ? `${err.code ?? err.status}: ${err.message}` : String(err);
      // Recorded as failed so it is not retried every few minutes; Claude's daily check lists failures.
      await deps.store.record({ ...base, status: "failed", error: error.slice(0, 300) });
      log({ event: "private_reply_failed", ...base, error });
      return { kind: "failed", ...base, error };
    }

    await deps.store.record({ ...base, status: "sent" });
    let public_reply: "posted" | "failed" = "posted";
    try {
      await ig.replyToComment(deps.g, c.id, publicReply);
    } catch (err) {
      public_reply = "failed";
      log({ event: "public_reply_failed", ...base, error: err instanceof Error ? err.message : String(err) });
    }
    log({ event: "trigger_sent", ...base, public_reply });
    return { kind: "sent", ...base, public_reply };
  }

  async function scan(): Promise<ScanResult> {
    const result: ScanResult = {
      autopilot: deps.cfg.autopilot,
      posts_scanned: 0,
      comments_scanned: 0,
      sent: [],
      would_send: [],
      failed: [],
      skipped: {},
      stopped_at_cap: false,
    };
    const cutoff = now() - deps.cfg.scanDays * DAY;
    const media = (await ig.listMedia(deps.g, deps.cfg.userId, { limit: 25 })).filter(
      (p) => (p.comments_count ?? 0) > 0 && (!p.timestamp || Date.parse(p.timestamp) >= cutoff),
    );

    let sends = 0;
    for (const post of media) {
      result.posts_scanned++;
      const comments = await ig.listComments(deps.g, post.id);
      result.comments_scanned += comments.length;
      const handled = await deps.store.handled(comments.map((c) => c.id));
      // One DM per person per post: someone who comments PACK twice gets one message.
      const m = await whoAmI();
      const person = (c: ig.IgComment) => c.from?.id ?? (c.username ?? c.from?.username)?.toLowerCase() ?? c.id;
      const served = new Set(
        comments
          .filter((c) => handled.has(c.id) || (c.replies?.data ?? []).some((r) => isOwn(m, { fromId: r.from?.id, username: r.username ?? r.from?.username })))
          .map(person),
      );
      // Oldest first, so people are answered in the order they commented.
      comments.sort((a, b) => Date.parse(a.timestamp ?? "") - Date.parse(b.timestamp ?? ""));
      for (const c of comments) {
        if (sends >= deps.cfg.maxSendsPerRun) {
          result.stopped_at_cap = true;
          break;
        }
        const o = await handleComment(
          { id: c.id, mediaId: post.id, text: c.text, timestamp: c.timestamp, username: c.username ?? c.from?.username, fromId: c.from?.id, replies: c.replies?.data },
          { alreadyHandled: handled.has(c.id) || served.has(person(c)) },
        );
        if (o.kind === "sent" || o.kind === "would_send") served.add(person(c));
        if (o.kind === "sent") {
          sends++;
          result.sent.push(o);
        } else if (o.kind === "would_send") {
          sends++;
          result.would_send.push(o);
        } else if (o.kind === "failed") result.failed.push(o);
        else result.skipped[o.reason] = (result.skipped[o.reason] ?? 0) + 1;
      }
      if (result.stopped_at_cap) break;
    }
    return result;
  }

  return { scan, handleComment, whoAmI };
}

export type Engine = ReturnType<typeof createEngine>;

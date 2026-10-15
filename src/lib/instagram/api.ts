// The Instagram API calls this engine uses (Instagram API with Instagram Login, host graph.instagram.com).
// Endpoints follow Meta's Instagram Platform docs: comment moderation, private replies, messaging,
// conversations and content publishing.

import type { GraphClient } from "./graph";

export type IgUser = { id: string; username?: string };
export type IgComment = {
  id: string;
  text?: string;
  timestamp?: string;
  username?: string;
  from?: IgUser;
  replies?: { data: IgComment[] };
};
export type IgMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
};

type Page<T> = { data: T[]; paging?: { next?: string } };

async function collect<T>(g: GraphClient, first: Promise<Page<T>>, maxPages: number): Promise<T[]> {
  const out: T[] = [];
  let page = await first;
  for (let i = 0; ; i++) {
    out.push(...(page.data ?? []));
    if (!page.paging?.next || i + 1 >= maxPages) break;
    page = await g.get<Page<T>>(page.paging.next);
  }
  return out;
}

export const getAccount = (g: GraphClient, userId: string) =>
  g.get<{ id: string; user_id?: string; username: string; name?: string; account_type?: string; followers_count?: number; follows_count?: number; media_count?: number }>(
    userId,
    { fields: "id,user_id,username,name,account_type,followers_count,follows_count,media_count" },
  );

export async function listMedia(g: GraphClient, userId: string, opts: { limit?: number; maxPages?: number } = {}) {
  return collect<IgMedia>(
    g,
    g.get(`${userId}/media`, {
      fields: "id,caption,media_type,media_product_type,permalink,timestamp,comments_count,like_count",
      limit: opts.limit ?? 25,
    }),
    opts.maxPages ?? 1,
  );
}

export async function listComments(g: GraphClient, mediaId: string, opts: { limit?: number; maxPages?: number } = {}) {
  return collect<IgComment>(
    g,
    g.get(`${mediaId}/comments`, {
      fields: "id,text,timestamp,username,from,replies{id,text,timestamp,username,from}",
      limit: opts.limit ?? 50,
    }),
    opts.maxPages ?? 4,
  );
}

export const replyToComment = (g: GraphClient, commentId: string, message: string) =>
  g.post<{ id: string }>(`${commentId}/replies`, { message });

export const setCommentHidden = (g: GraphClient, commentId: string, hide: boolean) =>
  g.post<{ success: boolean }>(commentId, {}, { hide: String(hide) });

/** One private reply per comment, within 7 days of the comment. It lands in the person's
 *  requests folder if they don't follow the account. */
export const sendPrivateReply = (g: GraphClient, userId: string, commentId: string, text: string) =>
  g.post<{ recipient_id: string; message_id: string }>(`${userId}/messages`, {
    recipient: { comment_id: commentId },
    message: { text },
  });

/** Only inside the 24-hour window after the person last messaged the account. */
export const sendMessage = (g: GraphClient, userId: string, recipientId: string, text: string) =>
  g.post<{ recipient_id: string; message_id: string }>(`${userId}/messages`, {
    recipient: { id: recipientId },
    message: { text },
  });

export async function listConversations(g: GraphClient, userId: string, limit = 10) {
  try {
    const page = await g.get<Page<Record<string, unknown>>>(`${userId}/conversations`, {
      platform: "instagram",
      fields: "id,updated_time,messages.limit(3){id,created_time,from,message}",
      limit,
    });
    return page.data ?? [];
  } catch {
    // Some accounts reject nested fields here; fall back to the documented minimum.
    const page = await g.get<Page<Record<string, unknown>>>(`${userId}/conversations`, { platform: "instagram", limit });
    return page.data ?? [];
  }
}

export async function getConversationMessages(g: GraphClient, conversationId: string, limit = 20) {
  // The API only returns details for the 20 most recent messages of a conversation.
  const n = Math.min(20, Math.max(1, limit));
  const conv = await g.get<{ messages?: Page<{ id: string }> }>(conversationId, { fields: "messages" });
  const ids = (conv.messages?.data ?? []).slice(0, n).map((m) => m.id);
  return Promise.all(ids.map((id) => g.get(id, { fields: "id,created_time,from,to,message" })));
}

export type ContainerInput = {
  image_url?: string;
  video_url?: string;
  media_type?: "REELS" | "CAROUSEL" | "STORIES" | "VIDEO";
  caption?: string;
  is_carousel_item?: boolean;
  children?: string;
  share_to_feed?: boolean;
  trial_params?: { graduation_strategy: "MANUAL" | "SS_PERFORMANCE" };
};

export const createContainer = (g: GraphClient, userId: string, input: ContainerInput) =>
  g.post<{ id: string }>(`${userId}/media`, input as Record<string, unknown>);

export const containerStatus = (g: GraphClient, containerId: string) =>
  g.get<{ id: string; status_code?: string; status?: string }>(containerId, { fields: "status_code,status" });

export const publishContainer = (g: GraphClient, userId: string, creationId: string) =>
  g.post<{ id: string }>(`${userId}/media_publish`, { creation_id: creationId });

export const publishingLimit = (g: GraphClient, userId: string) =>
  g.get(`${userId}/content_publishing_limit`, { fields: "quota_usage,config" });

export const mediaInsights = (g: GraphClient, mediaId: string, metrics: string[]) =>
  g.get(`${mediaId}/insights`, { metric: metrics.join(",") });

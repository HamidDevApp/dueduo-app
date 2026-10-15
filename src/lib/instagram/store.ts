// Remembers which comments the engine already handled, so a comment never gets two DMs.
// Stores only Instagram IDs (comment, post), the trigger word and the outcome: no usernames, no text.

export type ActionStatus = "sent" | "failed" | "dry_run";
export type ActionRecord = {
  comment_id: string;
  media_id: string;
  trigger: string;
  status: ActionStatus;
  error?: string;
  created_at?: string;
};

export interface ActionStore {
  /** Comment IDs from `ids` that already have a sent or failed record. */
  handled(ids: string[]): Promise<Set<string>>;
  record(r: ActionRecord): Promise<void>;
  recent(limit: number): Promise<ActionRecord[]>;
  /** Deletes records older than `days` (the privacy page promises 12 months). */
  prune(days: number): Promise<void>;
}

export class MemoryStore implements ActionStore {
  rows: ActionRecord[] = [];
  async handled(ids: string[]) {
    const done = new Set(this.rows.filter((r) => r.status !== "dry_run").map((r) => r.comment_id));
    return new Set(ids.filter((id) => done.has(id)));
  }
  async record(r: ActionRecord) {
    if (r.status !== "dry_run" && this.rows.some((x) => x.comment_id === r.comment_id && x.status !== "dry_run")) return;
    this.rows.push({ ...r, created_at: r.created_at ?? new Date().toISOString() });
  }
  async recent(limit: number) {
    return this.rows.slice(-limit).reverse();
  }
  async prune(days: number) {
    const cutoff = Date.now() - days * 86400000;
    this.rows = this.rows.filter((r) => Date.parse(r.created_at ?? "") >= cutoff);
  }
}

/** Supabase table public.ig_comment_actions (see supabase/ig_comment_actions.sql), through the REST API
 *  with the service role key the app already uses on the server. */
export class SupabaseStore implements ActionStore {
  constructor(private url: string, private serviceKey: string, private fetchImpl: typeof fetch = fetch) {}

  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.serviceKey, Authorization: `Bearer ${this.serviceKey}`, "Content-Type": "application/json", ...extra };
  }

  async handled(ids: string[]) {
    if (!ids.length) return new Set<string>();
    const list = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
    const res = await this.fetchImpl(
      `${this.url}/rest/v1/ig_comment_actions?select=comment_id&status=neq.dry_run&comment_id=in.(${encodeURIComponent(list)})`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`ig_comment_actions read failed: HTTP ${res.status}`);
    const rows = (await res.json()) as { comment_id: string }[];
    return new Set(rows.map((r) => r.comment_id));
  }

  async record(r: ActionRecord) {
    if (r.status === "dry_run") return; // dry runs are reported, not stored
    const res = await this.fetchImpl(`${this.url}/rest/v1/ig_comment_actions`, {
      method: "POST",
      headers: this.headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify({ comment_id: r.comment_id, media_id: r.media_id, trigger: r.trigger, status: r.status, error: r.error ?? null }),
    });
    if (!res.ok) throw new Error(`ig_comment_actions write failed: HTTP ${res.status}`);
  }

  async recent(limit: number) {
    const res = await this.fetchImpl(
      `${this.url}/rest/v1/ig_comment_actions?select=comment_id,media_id,trigger,status,error,created_at&order=created_at.desc&limit=${limit}`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`ig_comment_actions read failed: HTTP ${res.status}`);
    return (await res.json()) as ActionRecord[];
  }

  async prune(days: number) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const res = await this.fetchImpl(`${this.url}/rest/v1/ig_comment_actions?created_at=lt.${encodeURIComponent(cutoff)}`, {
      method: "DELETE",
      headers: this.headers({ Prefer: "return=minimal" }),
    });
    if (!res.ok) throw new Error(`ig_comment_actions prune failed: HTTP ${res.status}`);
  }
}

let memory: MemoryStore | undefined;

export function storeFromEnv(env: Record<string, string | undefined> = process.env): ActionStore {
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return new SupabaseStore(url, key);
  // Without a database the engine still avoids doubles: it skips comments it already replied to publicly.
  return (memory ??= new MemoryStore());
}

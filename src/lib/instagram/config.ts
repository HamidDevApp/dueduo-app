// Settings for the Instagram engine and MCP server, read from environment variables.
// Secrets live only in the environment (Vercel project settings or the local shell), never in code or chat.

export type InstagramConfig = {
  accessToken: string;
  /** Instagram professional account ID. "me" works for every call this engine makes. */
  userId: string;
  /** e.g. https://graph.instagram.com/v25.0 */
  apiBase: string;
  appSecret?: string;
  webhookVerifyToken?: string;
  pollKey?: string;
  mcpKey?: string;
  /** Comma-separated CIDR ranges allowed to call the MCP endpoint, e.g. 160.79.104.0/21 (Anthropic). */
  mcpAllowedCidrs: string[];
  /** MCP write tools (reply, hide, DM, publish) are refused unless this is true. */
  allowWrites: boolean;
  /** "on": the poller and webhook send the trigger DMs. Anything else: dry run, nothing is sent. */
  autopilot: boolean;
  /** Most trigger DMs one poll run may send. Keeps a sudden burst gentle. */
  maxSendsPerRun: number;
  /** Only posts newer than this are scanned. Private replies are only allowed within 7 days of the comment. */
  scanDays: number;
};

const flag = (v: string | undefined) => ["1", "true", "on", "yes"].includes((v ?? "").trim().toLowerCase());

export function loadConfig(env: Record<string, string | undefined> = process.env): InstagramConfig {
  const accessToken = env.IG_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("IG_ACCESS_TOKEN is not set");
  return {
    accessToken,
    userId: env.IG_USER_ID?.trim() || "me",
    apiBase: (env.IG_API_BASE?.trim() || "https://graph.instagram.com/v25.0").replace(/\/+$/, ""),
    appSecret: env.IG_APP_SECRET?.trim() || undefined,
    webhookVerifyToken: env.IG_WEBHOOK_VERIFY_TOKEN?.trim() || undefined,
    pollKey: env.IG_POLL_KEY?.trim() || env.CRON_SECRET?.trim() || undefined,
    mcpKey: env.IG_MCP_KEY?.trim() || undefined,
    mcpAllowedCidrs: (env.IG_MCP_ALLOWED_CIDRS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    allowWrites: flag(env.IG_ALLOW_WRITES),
    autopilot: flag(env.IG_AUTOPILOT),
    maxSendsPerRun: Math.max(1, Number(env.IG_MAX_SENDS_PER_RUN) || 25),
    scanDays: Math.min(7, Math.max(1, Number(env.IG_SCAN_DAYS) || 7)),
  };
}

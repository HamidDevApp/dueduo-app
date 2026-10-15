import { loadConfig, type InstagramConfig } from "./config";
import { createGraphClient, type GraphClient } from "./graph";
import { storeFromEnv, type ActionStore } from "./store";
import { createEngine, type Engine } from "./engine";
import { TRIGGERS, type Trigger } from "./triggers";

export type InstagramContext = { cfg: InstagramConfig; g: GraphClient; store: ActionStore; engine: Engine; triggers: Trigger[] };

let cached: InstagramContext | undefined;

export function createContext(
  env: Record<string, string | undefined> = process.env,
  overrides: { fetchImpl?: typeof fetch; store?: ActionStore; triggers?: Trigger[]; now?: () => number; log?: (e: Record<string, unknown>) => void } = {},
): InstagramContext {
  const cfg = loadConfig(env);
  const g = createGraphClient({ apiBase: cfg.apiBase, accessToken: cfg.accessToken, fetchImpl: overrides.fetchImpl });
  const store = overrides.store ?? storeFromEnv(env);
  // IG_ACTIVE_TRIGGERS=PACK,SPLIT switches words on from Vercel settings without a code change.
  const activeList = env.IG_ACTIVE_TRIGGERS?.split(",").map((w) => w.trim().toUpperCase()).filter(Boolean);
  const triggers =
    overrides.triggers ?? (activeList ? TRIGGERS.map((t) => ({ ...t, active: activeList.includes(t.word.toUpperCase()) })) : TRIGGERS);
  const engine = createEngine({ g, cfg, store, triggers, now: overrides.now, log: overrides.log });
  return { cfg, g, store, engine, triggers };
}

/** One context per server process (or warm serverless instance). */
export function getContext(): InstagramContext {
  return (cached ??= createContext());
}

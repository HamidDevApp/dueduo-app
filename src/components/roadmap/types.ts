import type { Owner } from "@/lib/roadmap";

/** What a task's action button does, resolved on the server. */
export type TaskActionView =
  | { kind: "link"; href: string; label: string }
  | { kind: "script"; label: string; title: string; text: string; tip?: string };

/** Owner labels relative to the viewer ("You", "Youssef", "Together"). */
export type OwnerLabels = Record<Owner, string>;

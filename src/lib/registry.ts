export const REGISTRY_PRIORITIES = ["must", "nice", "later"] as const;
export type RegistryPriority = (typeof REGISTRY_PRIORITIES)[number];

export const REGISTRY_STATUSES = ["wanted", "purchased", "received"] as const;
export type RegistryStatus = (typeof REGISTRY_STATUSES)[number];

export const PRIORITY_LABELS: Record<RegistryPriority, { title: string; hint: string }> = {
  must: { title: "Must-haves", hint: "Needed before baby arrives." },
  nice: { title: "Nice to have", hint: "Great gift ideas." },
  later: { title: "For later", hint: "Needed after 3 months — no rush." },
};

export const STATUS_LABELS: Record<RegistryStatus, string> = {
  wanted: "Still needed",
  purchased: "Bought",
  received: "Received",
};

export const REGISTRY_CATEGORY_SUGGESTIONS = ["Travel", "Sleep", "Feeding", "Clothing", "Bath & care", "Play", "For mom"];

export type RegistryItem = {
  id: string;
  name: string;
  category: string | null;
  priority: RegistryPriority;
  url: string | null;
  price: number | null;
  status: RegistryStatus;
};

/** Accepts only http(s) links; returns null otherwise. */
export function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.startsWith("http") ? value : `https://${value}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

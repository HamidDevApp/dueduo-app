"use server";

import { revalidatePath } from "next/cache";
import { STARTER_KIT } from "@/lib/budget";
import { UUID_RE, readEnum, readNumber, readText } from "@/lib/form";
import { REGISTRY_PRIORITIES, REGISTRY_STATUSES, safeUrl, type RegistryStatus } from "@/lib/registry";
import { getSpace } from "@/lib/space";

export type RegistryFormState = { ok: boolean; error: string | null; savedAt?: number };

function refresh() {
  revalidatePath("/registry");
  revalidatePath("/dashboard");
}

/** Create (no id) or update (with id) a registry item. */
export async function saveRegistryItem(_prev: RegistryFormState, fd: FormData): Promise<RegistryFormState> {
  const id = readText(fd, "id", 36);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "Invalid item." };

  const name = readText(fd, "name", 120);
  if (!name) return { ok: false, error: "What's the item?" };

  const priority = readEnum(fd, "priority", REGISTRY_PRIORITIES);
  if (!priority) return { ok: false, error: "Choose a priority." };

  const rawUrl = readText(fd, "url", 500);
  const url = safeUrl(rawUrl);
  if (rawUrl && !url) return { ok: false, error: "That link doesn't look right." };

  const price = readNumber(fd, "price", 0, 10_000_000);
  if (price === undefined) return { ok: false, error: "Please check the price." };

  const values = { name, priority, url, price, category: readText(fd, "category", 60) };

  const { supabase, ownerId } = await getSpace();
  const { error } = id
    ? await supabase.from("registry_items").update(values).eq("id", id).eq("user_id", ownerId)
    : await supabase.from("registry_items").insert({ ...values, user_id: ownerId });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setRegistryStatus(id: string, status: RegistryStatus): Promise<void> {
  if (!UUID_RE.test(id) || !REGISTRY_STATUSES.includes(status)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("registry_items").update({ status }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteRegistryItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("registry_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Seeds the registry from the Smart Budget starter kit (skips names already present). */
export async function importRegistryStarter(): Promise<void> {
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("registry_items").select("name").eq("user_id", ownerId);
  const existing = new Set((data ?? []).map((r) => (r.name as string).toLowerCase()));

  const rows = STARTER_KIT.filter((i) => !existing.has(i.label.toLowerCase())).map((i) => ({
    user_id: ownerId,
    name: i.label,
    priority: i.need_level === "essential" ? "must" : "nice",
  }));
  if (rows.length) await supabase.from("registry_items").insert(rows);
  refresh();
}

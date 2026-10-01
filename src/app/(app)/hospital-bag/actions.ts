"use server";

import { revalidatePath } from "next/cache";
import { UUID_RE, readEnum, readText } from "@/lib/form";
import { BAGS, DEFAULT_BAG, type Bag } from "@/lib/hospital-bag";
import { getSpace } from "@/lib/space";

export type BagFormState = { ok: boolean; error: string | null };

function refresh() {
  revalidatePath("/hospital-bag");
  revalidatePath("/dashboard");
}

export async function setPacked(id: string, packed: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").update({ is_packed: packed }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function addBagItem(_prev: BagFormState, fd: FormData): Promise<BagFormState> {
  const bag = readEnum(fd, "bag", BAGS);
  const label = readText(fd, "label", 120);
  if (!bag) return { ok: false, error: "Choose a bag." };
  if (!label) return { ok: false, error: "What do you want to pack?" };

  const { supabase, ownerId } = await getSpace();
  const { data: last } = await supabase
    .from("hospital_bag_items")
    .select("sort_order")
    .eq("user_id", ownerId)
    .eq("bag", bag)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("hospital_bag_items").insert({
    user_id: ownerId,
    bag,
    label,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null };
}

export async function deleteBagItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Re-adds any suggested items missing from a bag (never duplicates). */
export async function restoreSuggestions(bag: Bag): Promise<void> {
  if (!BAGS.includes(bag)) return;
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("hospital_bag_items").select("label").eq("user_id", ownerId).eq("bag", bag);
  const existing = new Set((data ?? []).map((r) => (r.label as string).toLowerCase()));

  const rows = DEFAULT_BAG[bag]
    .map((label, i) => ({ user_id: ownerId, bag, label, sort_order: i + 1 }))
    .filter((r) => !existing.has(r.label.toLowerCase()));
  if (rows.length) await supabase.from("hospital_bag_items").insert(rows);
  refresh();
}

/** Unticks everything in a bag — handy for a re-check at week 37. */
export async function unpackAll(bag: Bag): Promise<void> {
  if (!BAGS.includes(bag)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").update({ is_packed: false }).eq("user_id", ownerId).eq("bag", bag);
  refresh();
}

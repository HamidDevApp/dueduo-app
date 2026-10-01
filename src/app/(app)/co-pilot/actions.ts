"use server";

import { revalidatePath } from "next/cache";
import { getSpace } from "@/lib/space";

export async function createPartnerInvite() {
  const { supabase, role } = await getSpace();
  if (role !== "owner") return;
  await supabase.from("partner_invites").insert({});
  revalidatePath("/co-pilot");
}

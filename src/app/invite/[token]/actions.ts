"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_partner_invite", { p_token: token });

  if (error) {
    const reason = error.message.includes("own_invite") ? "own" : "invalid";
    redirect(`/invite/${encodeURIComponent(token)}?error=${reason}`);
  }

  revalidatePath("/", "layout");
  redirect("/co-pilot");
}

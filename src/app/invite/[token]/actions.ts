"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_partner_invite", { p_token: token });

  if (error) {
    // A second submit (double tap, refresh, back button) finds the invite already used.
    // If this user is already in a shared plan, the first one worked: just take them there.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from("pregnancy_members")
        .select("owner_id")
        .eq("member_id", user.id)
        .maybeSingle();
      if (membership) {
        revalidatePath("/", "layout");
        redirect("/co-pilot");
      }
    }

    console.error("[invite] accept failed", error.message);
    const reason = error.message.includes("own_invite") ? "own" : "invalid";
    redirect(`/invite/${encodeURIComponent(token)}?error=${reason}`);
  }

  revalidatePath("/", "layout");
  redirect("/co-pilot");
}

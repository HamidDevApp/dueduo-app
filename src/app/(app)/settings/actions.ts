"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readEnum } from "@/lib/form";
import { CURRENCIES } from "@/lib/money";
import { getSpace } from "@/lib/space";

export type SettingsFormState = { ok: boolean; error: string | null; savedAt?: number };

const WORK_STATUS = ["not_yet", "told", "not_applicable"] as const;
const VISITOR_POLICY = ["welcome", "limited", "none_first_weeks"] as const;

/** Owner only: preferences that personalise scripts and money screens. */
export async function savePreferences(_prev: SettingsFormState, fd: FormData): Promise<SettingsFormState> {
  const currency = readEnum(fd, "currency", CURRENCIES);
  const workStatus = readEnum(fd, "work_status", WORK_STATUS);
  const visitorPolicy = readEnum(fd, "visitor_policy", VISITOR_POLICY);
  if (!currency || !workStatus || !visitorPolicy) return { ok: false, error: "Please check your choices." };

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return { ok: false, error: "Only the plan owner can change these settings." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ currency, work_status: workStatus, visitor_policy: visitorPolicy })
    .eq("id", user.id)
    .select("id");

  // Supabase doesn't error on 0-row updates — check explicitly.
  if (error || !data?.length) {
    console.error("[settings] preferences update failed", { userId: user.id, error, rows: data?.length ?? 0 });
    return { ok: false, error: "Couldn't save. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, error: null, savedAt: Date.now() };
}

/** Owner: remove the Co-Pilot. Their access ends immediately; shared data stays with you. */
export async function removeCoPilot(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return;
  await supabase.from("pregnancy_members").delete().eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

/** Owner: invalidate any invite links that haven't been used yet. */
export async function revokeInvites(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return;
  await supabase.from("partner_invites").delete().eq("owner_id", user.id).is("accepted_at", null);
  revalidatePath("/settings");
  revalidatePath("/co-pilot");
}

/** Partner: leave the shared plan. */
export async function leavePlan(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "partner") return;
  await supabase.from("pregnancy_members").delete().eq("member_id", user.id);
  revalidatePath("/", "layout");
  redirect("/");
}

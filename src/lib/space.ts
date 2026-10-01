import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SpaceRole = "owner" | "partner";

export type SpaceProfile = {
  id: string;
  full_name: string | null;
  partner_name: string | null;
  hospital_name: string | null;
  due_date: string | null;
  currency: string;
  mom_monthly_income: number | null;
  partner_monthly_income: number | null;
  mom_leave_weeks: number | null;
  mom_paid_weeks: number | null;
  mom_leave_pay_percent: number | null;
  partner_leave_weeks: number | null;
  work_status: "not_yet" | "told" | "not_applicable";
  visitor_policy: "welcome" | "limited" | "none_first_weeks";
  onboarded_at: string | null;
  has_access: boolean;
};

const PROFILE_COLUMNS =
  "id, full_name, partner_name, hospital_name, due_date, currency, mom_monthly_income, partner_monthly_income, mom_leave_weeks, mom_paid_weeks, mom_leave_pay_percent, partner_leave_weeks, work_status, visitor_policy, onboarded_at, has_access";

/**
 * The pregnancy space the signed-in user works in.
 * Owners see their own space; partners see the space they joined.
 * Cached per request, so layouts and pages can both call it for free.
 */
export const getSpace = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("pregnancy_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .maybeSingle();

  const ownerId: string = membership?.owner_id ?? user.id;
  const role: SpaceRole = membership ? "partner" : "owner";

  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", ownerId).single();
  const profile = data as SpaceProfile | null;

  return { supabase, user, ownerId, role, profile };
});

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURRENCIES } from "@/lib/money";
import { dueDateFromLmp, validateDueDate, validateLmp } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export type OnboardingState = { error: string | null; step?: number };

const WORK_STATUS = ["not_yet", "told", "not_applicable"] as const;
const VISITOR_POLICY = ["welcome", "limited", "none_first_weeks"] as const;

function text(fd: FormData, key: string, max: number) {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s.length ? s : null;
}

/** Optional number in [min, max]; returns undefined when invalid. */
function num(fd: FormData, key: string, min: number, max: number): number | null | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // ---- Step 1: due date
  const mode = formData.get("mode");
  const date = String(formData.get("date") ?? "");
  let dueDate: string;
  if (mode === "due") {
    const error = validateDueDate(date);
    if (error) return { error, step: 0 };
    dueDate = date;
  } else if (mode === "lmp") {
    const error = validateLmp(date);
    if (error) return { error, step: 0 };
    dueDate = dueDateFromLmp(date);
  } else {
    return { error: "Please choose how you'd like to set your due date.", step: 0 };
  }

  // ---- Step 3: money (all optional, but must be sane if given)
  const momIncome = num(formData, "mom_monthly_income", 0, 10_000_000);
  const partnerIncome = num(formData, "partner_monthly_income", 0, 10_000_000);
  const leaveWeeks = num(formData, "mom_leave_weeks", 0, 104);
  const paidWeeks = num(formData, "mom_paid_weeks", 0, 104);
  const payPercent = num(formData, "mom_leave_pay_percent", 0, 100);
  const partnerLeave = num(formData, "partner_leave_weeks", 0, 104);
  if ([momIncome, partnerIncome, leaveWeeks, paidWeeks, payPercent, partnerLeave].includes(undefined)) {
    return { error: "Please check the numbers — some values are out of range.", step: 2 };
  }
  if (leaveWeeks != null && paidWeeks != null && paidWeeks > leaveWeeks) {
    return { error: "Paid weeks can't be more than your total leave weeks.", step: 2 };
  }

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") redirect("/dashboard");

  // التعديل الجديد ديال Claude كيبدا من هنا
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      due_date: dueDate,
      full_name: text(formData, "full_name", 80),
      partner_name: text(formData, "partner_name", 80),
      hospital_name: text(formData, "hospital_name", 120),
      currency: oneOf(formData.get("currency"), CURRENCIES, "USD"),
      mom_monthly_income: momIncome,
      partner_monthly_income: partnerIncome,
      mom_leave_weeks: leaveWeeks,
      mom_paid_weeks: paidWeeks,
      mom_leave_pay_percent: payPercent,
      partner_leave_weeks: partnerLeave,
      work_status: oneOf(formData.get("work_status"), WORK_STATUS, "not_yet"),
      visitor_policy: oneOf(formData.get("visitor_policy"), VISITOR_POLICY, "limited"),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id"); // ضروري باش يرجع شحال من سطر تقاس

  // Supabase does NOT error when an update matches 0 rows (missing profile or RLS),
  // so check the returned rows explicitly.
  if (error || !updated?.length) {
    console.error("[onboarding] profile update failed", {
      userId: user.id,
      error,
      rowsUpdated: updated?.length ?? 0,
    });
    return {
      error: error
        ? "We couldn't save your plan. Please try again."
        : "Your profile wasn't found. Please sign out and in again, or contact support.",
    };
  }
  // التعديل كيسالي هنا

  // ---- Step 2: Co-Pilot invite (only if none is pending already)
  const wantsCoPilot = formData.get("invite_partner") === "on";
  if (wantsCoPilot) {
    const { count } = await supabase
      .from("partner_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());
    if (!count) await supabase.from("partner_invites").insert({});
  }

  revalidatePath("/", "layout");
  redirect(wantsCoPilot ? "/co-pilot?welcome=1" : "/dashboard");
}

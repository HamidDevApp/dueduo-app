"use server";

import { revalidatePath } from "next/cache";
import { BUDGET_CATEGORIES, NEED_LEVELS, SOURCES, STARTER_KIT, type NeedLevel } from "@/lib/budget";
import { UUID_RE, readEnum, readNumber, readText } from "@/lib/form";
import { CURRENCIES } from "@/lib/money";
import { getSpace } from "@/lib/space";

export type BudgetFormState = { ok: boolean; error: string | null; savedAt?: number };

const MAX_AMOUNT = 10_000_000;

function refresh() {
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/* ---------------- Budget items ---------------- */

/** Create (no id) or update (with id) a budget item. */
export async function saveBudgetItem(_prev: BudgetFormState, fd: FormData): Promise<BudgetFormState> {
  const id = readText(fd, "id", 36);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "Invalid item." };

  const label = readText(fd, "label", 120);
  if (!label) return { ok: false, error: "What is it?" };

  const category = readEnum(fd, "category", BUDGET_CATEGORIES);
  const needLevel = readEnum(fd, "need_level", NEED_LEVELS);
  const source = readEnum(fd, "source", SOURCES);
  if (!category || !needLevel || !source) return { ok: false, error: "Please check the dropdowns." };

  const estimated = readNumber(fd, "estimated", 0, MAX_AMOUNT);
  const actual = readNumber(fd, "actual", 0, MAX_AMOUNT);
  const buyByWeek = readNumber(fd, "buy_by_week", 0, 42);
  if (estimated === undefined || actual === undefined || buyByWeek === undefined) {
    return { ok: false, error: "Please check the amounts." };
  }

  const values = {
    label,
    category,
    need_level: needLevel,
    source,
    estimated: estimated ?? 0,
    actual: actual ?? 0,
    buy_by_week: buyByWeek === null ? null : Math.round(buyByWeek),
  };

  const { supabase, ownerId } = await getSpace();
  const { error } = id
    ? await supabase.from("budget_items").update(values).eq("id", id).eq("user_id", ownerId)
    : await supabase.from("budget_items").insert({ ...values, user_id: ownerId });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setItemPaid(id: string, isPaid: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").update({ is_paid: isPaid }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function setItemNeedLevel(id: string, level: NeedLevel): Promise<void> {
  if (!UUID_RE.test(id) || !NEED_LEVELS.includes(level)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").update({ need_level: level }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteBudgetItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Adds the lean starter kit, skipping anything already on the list (by label). */
export async function importStarterKit(): Promise<void> {
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("budget_items").select("label").eq("user_id", ownerId);
  const existing = new Set((data ?? []).map((r) => (r.label as string).toLowerCase()));

  const rows = STARTER_KIT.filter((i) => !existing.has(i.label.toLowerCase())).map((i) => ({
    user_id: ownerId,
    label: i.label,
    category: i.category,
    need_level: i.need_level,
    source: i.source ?? "buy_new",
    buy_by_week: i.buy_by_week,
    estimated: 0,
    actual: 0,
  }));

  if (rows.length) await supabase.from("budget_items").insert(rows);
  refresh();
}

/* ---------------- Leave plan (profile — owner only) ---------------- */

export async function saveLeavePlan(_prev: BudgetFormState, fd: FormData): Promise<BudgetFormState> {
  const currency = readEnum(fd, "currency", CURRENCIES);
  const momIncome = readNumber(fd, "mom_monthly_income", 0, MAX_AMOUNT);
  const partnerIncome = readNumber(fd, "partner_monthly_income", 0, MAX_AMOUNT);
  const leaveWeeks = readNumber(fd, "mom_leave_weeks", 0, 104);
  const paidWeeks = readNumber(fd, "mom_paid_weeks", 0, 104);
  const payPercent = readNumber(fd, "mom_leave_pay_percent", 0, 100);
  const partnerLeave = readNumber(fd, "partner_leave_weeks", 0, 104);

  if (!currency) return { ok: false, error: "Choose a currency." };
  if ([momIncome, partnerIncome, leaveWeeks, paidWeeks, payPercent, partnerLeave].includes(undefined)) {
    return { ok: false, error: "Some values are out of range." };
  }
  if (leaveWeeks != null && paidWeeks != null && paidWeeks > leaveWeeks) {
    return { ok: false, error: "Paid weeks can't be more than total leave weeks." };
  }

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return { ok: false, error: "Only the plan owner can change the leave plan." };

  const round = (n: number | null | undefined) => (n == null ? null : Math.round(n));
  const { error } = await supabase
    .from("profiles")
    .update({
      currency,
      mom_monthly_income: momIncome,
      partner_monthly_income: partnerIncome,
      mom_leave_weeks: round(leaveWeeks),
      mom_paid_weeks: round(paidWeeks),
      mom_leave_pay_percent: round(payPercent),
      partner_leave_weeks: round(partnerLeave),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true, error: null, savedAt: Date.now() };
}

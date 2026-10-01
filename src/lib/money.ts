/* =========================================================
   Smart Budgeting — leave income plan maths.
   Pure functions: safe to use in client previews and on the server.
   ========================================================= */

export const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "CAD", "AUD", "MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type LeaveInput = {
  monthlyIncome: number | null;  // mom's normal take-home per month
  leaveWeeks: number | null;     // total weeks off
  paidWeeks: number | null;      // weeks with any pay
  payPercent: number | null;     // % of normal pay during paid weeks
};

export type LeavePlan = {
  /** Total take-home income lost during leave. */
  incomeGap: number;
  /** Weeks with no pay at all. */
  unpaidWeeks: number;
  /** Suggested amount to set aside each month until the due date. */
  monthlySavingsTarget: number | null;
};

const WEEKS_PER_MONTH = 52 / 12;

export function estimateLeavePlan(input: LeaveInput, daysUntilDue: number): LeavePlan | null {
  const { monthlyIncome, leaveWeeks } = input;
  if (!monthlyIncome || !leaveWeeks) return null;

  const paidWeeks = Math.min(input.paidWeeks ?? 0, leaveWeeks);
  const payPercent = Math.min(Math.max(input.payPercent ?? 0, 0), 100);
  const weekly = monthlyIncome / WEEKS_PER_MONTH;

  const unpaidWeeks = leaveWeeks - paidWeeks;
  const incomeGap = Math.round(weekly * (paidWeeks * (1 - payPercent / 100) + unpaidWeeks));

  const monthsLeft = daysUntilDue / 30.44;
  const monthlySavingsTarget =
    incomeGap > 0 && monthsLeft >= 1 ? Math.round(incomeGap / Math.floor(monthsLeft)) : null;

  return { incomeGap, unpaidWeeks, monthlySavingsTarget };
}

/** Monthly amount to set aside to reach `total` by the due date (null if nothing to save or < 1 month left). */
export function monthlyTarget(total: number, daysUntilDue: number): number | null {
  const months = Math.floor(daysUntilDue / 30.44);
  return total > 0 && months >= 1 ? Math.round(total / months) : null;
}

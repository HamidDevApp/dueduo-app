"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { saveLeavePlan, type BudgetFormState } from "@/app/(app)/budget/actions";
import { CURRENCIES, estimateLeavePlan, monthlyTarget } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

export type LeaveDefaults = {
  currency: string;
  momIncome: string;
  partnerIncome: string;
  leaveWeeks: string;
  paidWeeks: string;
  payPercent: string;
  partnerLeaveWeeks: string;
};

type Props = {
  defaults: LeaveDefaults;
  daysToGo: number;
  /** Essentials not yet paid for — added to the "save per month" figure. */
  essentialsRemaining: number;
  readOnly: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand disabled:bg-canvas disabled:text-muted";

function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={strong ? "rounded-xl bg-brand-soft/70 p-4" : "rounded-xl bg-canvas p-4"}>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function LeavePlanForm({ defaults, daysToGo, essentialsRemaining, readOnly }: Props) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(saveLeavePlan, { ok: false, error: null });
  const [f, setF] = useState(defaults);
  const set = (k: keyof LeaveDefaults) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const plan = estimateLeavePlan(
    { monthlyIncome: n(f.momIncome), leaveWeeks: n(f.leaveWeeks), paidWeeks: n(f.paidWeeks), payPercent: n(f.payPercent) },
    daysToGo,
  );
  const gap = plan?.incomeGap ?? 0;
  const totalToSave = gap + essentialsRemaining;
  const perMonth = monthlyTarget(totalToSave, daysToGo);
  const money = (v: number) => formatMoney(v, f.currency);

  const fields: { key: keyof LeaveDefaults; name: string; label: string; max?: number; mode: "decimal" | "numeric" }[] = [
    { key: "momIncome", name: "mom_monthly_income", label: "Your monthly take-home", mode: "decimal" },
    { key: "partnerIncome", name: "partner_monthly_income", label: "Partner's monthly take-home", mode: "decimal" },
    { key: "leaveWeeks", name: "mom_leave_weeks", label: "Your total leave (weeks)", max: 104, mode: "numeric" },
    { key: "paidWeeks", name: "mom_paid_weeks", label: "Of which paid (weeks)", max: 104, mode: "numeric" },
    { key: "payPercent", name: "mom_leave_pay_percent", label: "Pay during paid leave (%)", max: 100, mode: "numeric" },
    { key: "partnerLeaveWeeks", name: "partner_leave_weeks", label: "Partner's leave (weeks)", max: 104, mode: "numeric" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <form action={action} className="space-y-4">
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Currency</span>
            <select name="currency" value={f.currency} onChange={set("currency")} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {fields.map((fl) => (
            <label key={fl.key} className="block">
              <span className="text-sm font-medium">{fl.label}</span>
              <input
                name={fl.name}
                type="number"
                min={0}
                max={fl.max}
                step="any"
                inputMode={fl.mode}
                value={f[fl.key]}
                onChange={set(fl.key)}
                className={inputClass}
              />
            </label>
          ))}
        </fieldset>

        {readOnly ? (
          <p className="text-sm text-muted">Only the plan owner can edit these numbers.</p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save leave plan"}
            </button>
            {state.ok && !pending && (
              <span className="inline-flex items-center gap-1 text-sm text-sage">
                <Check className="size-4" aria-hidden /> Saved
              </span>
            )}
            {state.error && (
              <span role="alert" className="text-sm text-brand-strong">
                {state.error}
              </span>
            )}
          </div>
        )}
      </form>

      <div aria-live="polite" className="space-y-3">
        {plan ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Leave income gap"
                value={money(gap)}
                hint={plan.unpaidWeeks ? `Includes ${plan.unpaidWeeks} unpaid weeks` : "All leave weeks are paid"}
              />
              <Stat label="Essentials still to buy" value={money(essentialsRemaining)} hint="From your Essential list" />
            </div>
            <Stat
              strong
              label="Your monthly savings target"
              value={perMonth ? `${money(perMonth)} / month` : totalToSave > 0 ? "Due date is close" : "You're covered 🎉"}
              hint={
                perMonth
                  ? `Sets aside ${money(totalToSave)} before your due date — so leave is about the baby, not the bills.`
                  : totalToSave > 0
                    ? "Focus on trimming the Nice-to-have list and using gifts or second-hand."
                    : undefined
              }
            />
          </>
        ) : (
          <div className="rounded-xl bg-canvas p-4 text-sm text-muted">
            Add your take-home pay and leave weeks to see your income gap and a calm monthly savings target.
          </div>
        )}
      </div>
    </div>
  );
}

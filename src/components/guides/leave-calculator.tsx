"use client";

import { useId, useState } from "react";
import { CURRENCIES, estimateLeavePlan, monthlyTarget, type Currency, type LeaveInput } from "@/lib/money";
import { getPregnancyStatus, isIsoDate } from "@/lib/pregnancy";
import { cn, formatMoney } from "@/lib/utils";

/** Public leave calculator. Everything stays in this component's state: nothing is saved, sent or tracked. */
type ParentFields = { pay: string; weeks: string; paid: string; percent: string };
const EMPTY: ParentFields = { pay: "", weeks: "", paid: "", percent: "" };

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Math.max(Number(v), 0));
const toInput = (f: ParentFields): LeaveInput => ({
  monthlyIncome: num(f.pay),
  leaveWeeks: num(f.weeks),
  paidWeeks: num(f.paid),
  payPercent: num(f.percent),
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand";

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: (id: string, helpId: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children(id, `${id}-help`)}
      <p id={`${id}-help`} className="mt-1 text-xs text-muted">
        {help}
      </p>
    </div>
  );
}

function ParentInputs({ value, onChange }: { value: ParentFields; onChange: (v: ParentFields) => void }) {
  const set = (k: keyof ParentFields) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  const numberProps = { type: "number", inputMode: "decimal" as const, min: 0, className: inputClass };
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Monthly take-home pay" help="What lands in your account each month, after tax.">
        {(id, h) => <input id={id} aria-describedby={h} {...numberProps} value={value.pay} onChange={set("pay")} />}
      </Field>
      <Field label="Weeks of leave" help="All the weeks you plan to take off.">
        {(id, h) => <input id={id} aria-describedby={h} {...numberProps} max={104} value={value.weeks} onChange={set("weeks")} />}
      </Field>
      <Field label="Paid weeks" help="How many of those weeks have any pay.">
        {(id, h) => <input id={id} aria-describedby={h} {...numberProps} max={104} value={value.paid} onChange={set("paid")} />}
      </Field>
      <Field label="Pay during paid weeks (%)" help="100 for full pay, 60 for 60% of your pay, and so on.">
        {(id, h) => <input id={id} aria-describedby={h} {...numberProps} max={100} value={value.percent} onChange={set("percent")} />}
      </Field>
    </div>
  );
}

export function LeaveCalculator() {
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [mom, setMom] = useState<ParentFields>(EMPTY);
  const [partner, setPartner] = useState<ParentFields>(EMPTY);
  const [partnerOn, setPartnerOn] = useState(true);

  const momPlan = estimateLeavePlan(toInput(mom), 0);
  const partnerPlan = partnerOn ? estimateLeavePlan(toInput(partner), 0) : null;
  const hasResult = Boolean(momPlan || partnerPlan);
  const a = momPlan?.incomeGap ?? 0;
  const b = partnerPlan?.incomeGap ?? 0;
  const total = a + b;
  const daysUntilDue = isIsoDate(dueDate) ? getPregnancyStatus(dueDate).daysToGo : null;
  const target = daysUntilDue == null ? null : monthlyTarget(total, daysUntilDue);
  const money = (v: number) => formatMoney(v, currency);
  const both = Boolean(momPlan && partnerPlan);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-2">
        <Field label="Due date" help="Used to count the months you have to save.">
          {(id, h) => (
            <input id={id} aria-describedby={h} type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          )}
        </Field>
        <Field label="Currency" help="USD, EUR, GBP, CHF, CAD, AUD or MAD.">
          {(id, h) => (
            <select id={id} aria-describedby={h} className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h2 className="mb-5 font-display text-xl font-semibold">Birthing parent</h2>
        <ParentInputs value={mom} onChange={setMom} />
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Partner</h2>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            Partner is taking leave too
            <button
              type="button"
              role="switch"
              aria-checked={partnerOn}
              onClick={() => setPartnerOn((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                partnerOn ? "bg-sage" : "bg-ink/20",
              )}
            >
              <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", partnerOn && "translate-x-5")} />
            </button>
          </label>
        </div>
        {partnerOn && (
          <div className="mt-5">
            <ParentInputs value={partner} onChange={setPartner} />
          </div>
        )}
      </section>

      <section aria-live="polite" className="rounded-[var(--radius-card)] border border-brand/20 bg-brand-soft/60 p-6">
        {!hasResult ? (
          <p className="text-muted">Enter your pay and weeks of leave to see your income gap.</p>
        ) : total === 0 ? (
          <p className="font-display text-2xl font-semibold">No income gap. Your leave is fully paid.</p>
        ) : (
          <div className="space-y-3">
            <p className="font-display text-2xl font-semibold">
              Income gap during leave: <span className="text-brand-strong">{money(total)}</span>
            </p>
            {both && (
              <p className="text-sm text-muted">
                {money(a)} for the birthing parent · {money(b)} for the partner
              </p>
            )}
            <p>
              Unpaid weeks:{" "}
              {[
                momPlan && `${momPlan.unpaidWeeks} for the birthing parent`,
                partnerPlan && `${partnerPlan.unpaidWeeks} for the partner`,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {daysUntilDue != null &&
              (target != null ? (
                <p className="font-semibold">Save {money(target)} a month from now until the due date to cover it.</p>
              ) : (
                <p className="font-semibold">
                  Your due date is less than a month away, so there&apos;s no monthly target. Plan for the full gap.
                </p>
              ))}
          </div>
        )}
        {hasResult && (
          <p className="mt-4 border-t border-brand/15 pt-4 text-sm text-muted">
            This doesn&apos;t include baby costs. DueDuo adds the rest of the baby budget: what to buy, skip or borrow, and
            when.
          </p>
        )}
      </section>
    </div>
  );
}

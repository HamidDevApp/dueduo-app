"use client";

import { useActionState, useState } from "react";
import { saveBudgetItem, type BudgetFormState } from "@/app/(app)/budget/actions";
import {
  BUDGET_CATEGORIES,
  CATEGORY_LABELS,
  NEED_LABELS,
  NEED_LEVELS,
  SOURCES,
  SOURCE_LABELS,
  type BudgetItem,
  type NeedLevel,
} from "@/lib/budget";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

type Props = { item?: BudgetItem; defaultNeed?: NeedLevel; currency: string; onDone: () => void };

export function BudgetItemForm({ item, defaultNeed = "essential", currency, onDone }: Props) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(saveBudgetItem, { ok: false, error: null });

  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) onDone();
  }

  const [f, setF] = useState({
    label: item?.label ?? "",
    category: item?.category ?? "baby_gear",
    need_level: item?.need_level ?? defaultNeed,
    source: item?.source ?? "buy_new",
    estimated: item?.estimated ? String(item.estimated) : "",
    actual: item?.actual ? String(item.actual) : "",
    buy_by_week: item?.buy_by_week != null ? String(item.buy_by_week) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Item</span>
          <input name="label" required maxLength={120} value={f.label} onChange={set("label")} placeholder="e.g. Stroller" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Do we need it?</span>
          <select name="need_level" value={f.need_level} onChange={set("need_level")} className={inputClass}>
            {NEED_LEVELS.map((n) => (
              <option key={n} value={n}>
                {NEED_LABELS[n].title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <select name="category" value={f.category} onChange={set("category")} className={inputClass}>
            {BUDGET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">How we&apos;ll get it</span>
          <select name="source" value={f.source} onChange={set("source")} className={inputClass}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Get it by week</span>
          <input name="buy_by_week" type="number" min={0} max={42} inputMode="numeric" value={f.buy_by_week} onChange={set("buy_by_week")} placeholder="e.g. 34" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            {f.need_level === "skip" ? "Price you'd have paid" : "Estimated cost"} ({currency})
          </span>
          <input name="estimated" type="number" min={0} step="any" inputMode="decimal" value={f.estimated} onChange={set("estimated")} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Actually spent ({currency})</span>
          <input name="actual" type="number" min={0} step="any" inputMode="decimal" value={f.actual} onChange={set("actual")} className={inputClass} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

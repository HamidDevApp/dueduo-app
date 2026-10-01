"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { deleteBudgetItem, setItemNeedLevel, setItemPaid } from "@/app/(app)/budget/actions";
import {
  CATEGORY_LABELS,
  NEED_LABELS,
  NEED_LEVELS,
  SOURCE_LABELS,
  type BudgetItem,
  type NeedLevel,
} from "@/lib/budget";
import { cn, formatMoney } from "@/lib/utils";
import { BudgetItemForm } from "./budget-item-form";

export function BudgetItemRow({ item, currency }: { item: BudgetItem; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useOptimistic(item.is_paid);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  if (editing) {
    return (
      <li className="py-4">
        <BudgetItemForm item={item} currency={currency} onDone={() => setEditing(false)} />
      </li>
    );
  }

  const money = (v: number) => formatMoney(v, currency);
  const isSkip = item.need_level === "skip";

  return (
    <li className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center", pending && "opacity-70")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {!isSkip && (
          <button
            type="button"
            role="checkbox"
            aria-checked={paid}
            aria-label={`Mark ${item.label} as ${paid ? "not bought" : "bought"}`}
            onClick={() =>
              startTransition(async () => {
                setPaid(!paid);
                await setItemPaid(item.id, !paid);
              })
            }
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
              paid ? "border-sage bg-sage text-white" : "border-line hover:border-sage",
            )}
          >
            {paid && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
          </button>
        )}
        <div className="min-w-0">
          <p className={cn("font-medium", paid && "text-muted line-through")}>{item.label}</p>
          <p className="mt-0.5 text-xs text-muted">
            {CATEGORY_LABELS[item.category]} · {SOURCE_LABELS[item.source]}
            {item.buy_by_week != null && !isSkip && ` · by week ${item.buy_by_week}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-right text-sm">
          {isSkip ? (
            <span className="font-semibold text-sage">{item.estimated ? `Kept ${money(item.estimated)}` : "Kept"}</span>
          ) : (
            <>
              <span className="font-semibold">{money(item.actual || item.estimated)}</span>
              <span className="block text-xs text-muted">
                {item.actual ? `planned ${money(item.estimated)}` : item.estimated ? "estimate" : "add a price"}
              </span>
            </>
          )}
        </p>

        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`need-${item.id}`}>
            Need level
          </label>
          <select
            id={`need-${item.id}`}
            value={item.need_level}
            onChange={(e) =>
              startTransition(async () => {
                await setItemNeedLevel(item.id, e.target.value as NeedLevel);
              })
            }
            className="rounded-lg border border-line bg-surface py-1.5 pr-7 pl-2 text-xs font-semibold"
          >
            {NEED_LEVELS.map((n) => (
              <option key={n} value={n}>
                {NEED_LABELS[n].title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${item.label}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink">
            <Pencil className="size-4" />
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setRemoved(true);
                  await deleteBudgetItem(item.id);
                })
              }
              onBlur={() => setConfirmDelete(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"
            >
              Delete?
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${item.label}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

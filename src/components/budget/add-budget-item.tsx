"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { NeedLevel } from "@/lib/budget";
import { BudgetItemForm } from "./budget-item-form";

export function AddBudgetItem({ need, currency, label }: { need: NeedLevel; currency: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
      >
        <Plus className="size-4" aria-hidden /> {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <BudgetItemForm key={key} defaultNeed={need} currency={currency} onDone={() => setOpen(false)} />
    </div>
  );
}

"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X } from "lucide-react";
import { deleteBagItem, setPacked } from "@/app/(app)/hospital-bag/actions";
import type { BagItem } from "@/lib/hospital-bag";
import { cn } from "@/lib/utils";

export function BagItemRow({ item }: { item: BagItem }) {
  const [, startTransition] = useTransition();
  const [packed, setOptimisticPacked] = useOptimistic(item.is_packed);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  return (
    <li className="group flex items-center gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={packed}
        onClick={() =>
          startTransition(async () => {
            setOptimisticPacked(!packed);
            await setPacked(item.id, !packed);
          })
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
            packed ? "border-sage bg-sage text-white" : "border-line group-hover:border-sage",
          )}
        >
          {packed && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
        </span>
        <span className={cn("min-w-0", packed && "text-muted line-through")}>{item.label}</span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${item.label}`}
        onClick={() =>
          startTransition(async () => {
            setRemoved(true);
            await deleteBagItem(item.id);
          })
        }
        className="rounded-lg p-1.5 text-muted opacity-60 hover:bg-canvas hover:text-brand-strong hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

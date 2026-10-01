"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addBagItem, type BagFormState } from "@/app/(app)/hospital-bag/actions";
import type { Bag } from "@/lib/hospital-bag";

export function BagAddForm({ bag }: { bag: Bag }) {
  const [state, action, pending] = useActionState<BagFormState, FormData>(addBagItem, { ok: false, error: null });

  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="bag" value={bag} />
      <label className="sr-only" htmlFor={`add-${bag}`}>
        Add an item
      </label>
      <input
        id={`add-${bag}`}
        name="label"
        required
        maxLength={120}
        placeholder="Add something else to pack…"
        className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Add item"
        className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink/90 disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden /> <span className="hidden sm:inline">Add</span>
      </button>
      {state.error && (
        <p role="alert" className="sr-only">
          {state.error}
        </p>
      )}
    </form>
  );
}

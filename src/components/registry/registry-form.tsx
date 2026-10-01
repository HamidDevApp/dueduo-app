"use client";

import { useActionState, useId, useState } from "react";
import { saveRegistryItem, type RegistryFormState } from "@/app/(app)/registry/actions";
import {
  PRIORITY_LABELS,
  REGISTRY_CATEGORY_SUGGESTIONS,
  REGISTRY_PRIORITIES,
  type RegistryItem,
  type RegistryPriority,
} from "@/lib/registry";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

type Props = { item?: RegistryItem; defaultPriority?: RegistryPriority; currency: string; onDone: () => void };

export function RegistryForm({ item, defaultPriority = "must", currency, onDone }: Props) {
  const [state, action, pending] = useActionState<RegistryFormState, FormData>(saveRegistryItem, { ok: false, error: null });

  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) onDone();
  }

  const listId = useId();
  const [f, setF] = useState({
    name: item?.name ?? "",
    priority: item?.priority ?? defaultPriority,
    category: item?.category ?? "",
    url: item?.url ?? "",
    price: item?.price != null ? String(item.price) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Item</span>
          <input name="name" required maxLength={120} value={f.name} onChange={set("name")} placeholder="e.g. Baby carrier" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Priority</span>
          <select name="priority" value={f.priority} onChange={set("priority")} className={inputClass}>
            {REGISTRY_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p].title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <input name="category" list={listId} maxLength={60} value={f.category} onChange={set("category")} placeholder="Optional" className={inputClass} />
          <datalist id={listId}>
            {REGISTRY_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Link</span>
          <input name="url" type="text" inputMode="url" maxLength={500} value={f.url} onChange={set("url")} placeholder="Shop link (optional)" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Price ({currency})</span>
          <input name="price" type="number" min={0} step="any" inputMode="decimal" value={f.price} onChange={set("price")} className={inputClass} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Saving…" : item ? "Save changes" : "Add to registry"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

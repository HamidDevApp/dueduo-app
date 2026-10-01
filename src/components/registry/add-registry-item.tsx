"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { RegistryPriority } from "@/lib/registry";
import { RegistryForm } from "./registry-form";

export function AddRegistryItem({ priority, currency }: { priority: RegistryPriority; currency: string }) {
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
        <Plus className="size-4" aria-hidden /> Add item
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <RegistryForm key={key} defaultPriority={priority} currency={currency} onDone={() => setOpen(false)} />
    </div>
  );
}

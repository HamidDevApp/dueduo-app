"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-strong px-3 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

type Props = {
  /** A server action taking no arguments. */
  action: () => Promise<void>;
  label: string;
  confirmText: string;
  confirmLabel?: string;
  tone?: "danger" | "neutral";
};

/** Two-step button: click, read the consequence, confirm. No browser dialogs. */
export function ConfirmAction({ action, label, confirmText, confirmLabel = "Yes, continue", tone = "danger" }: Props) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm font-semibold",
          tone === "danger"
            ? "border-brand/40 text-brand-strong hover:bg-brand-soft"
            : "border-line text-ink hover:bg-canvas",
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/50 p-3">
      <p className="text-sm">{confirmText}</p>
      <form action={action} className="mt-3 flex gap-2">
        <SubmitButton label={confirmLabel} />
        <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas">
          Cancel
        </button>
      </form>
    </div>
  );
}

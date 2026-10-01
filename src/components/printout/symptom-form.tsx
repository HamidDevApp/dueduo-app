"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { addSymptom, type FormState } from "@/app/(app)/appointments/print/actions";
import { SEVERITY_LABELS, type Severity } from "./types";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

export function SymptomForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSymptom, { ok: false, error: null });
  const [severity, setSeverity] = useState<Severity>(1);

  return (
    // React 19 resets this uncontrolled form after each submit — exactly what we want for quick logging.
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">What are you noticing?</span>
        <input name="symptom" required maxLength={200} placeholder="e.g. Headaches in the evening" className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">How strong?</span>
          <select
            name="severity"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value) as Severity)}
            className={inputClass}
          >
            {([1, 2, 3] as const).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">When</span>
          <input name="logged_on" type="date" defaultValue={today} max={today} required className={inputClass} />
        </label>
      </div>

      {severity === 3 && (
        <p role="note" className="rounded-xl bg-brand-soft p-3 text-sm text-brand-strong">
          If this is severe right now, don&apos;t wait for your appointment — call your provider or emergency care.
        </p>
      )}

      <label className="block">
        <span className="text-sm font-medium">Notes (optional)</span>
        <input name="notes" maxLength={500} placeholder="How often, what helps, what makes it worse" className={inputClass} />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-ink/90 disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden /> {pending ? "Saving…" : "Log symptom"}
      </button>
    </form>
  );
}

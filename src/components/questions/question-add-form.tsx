"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addQuestion, type QuestionFormState } from "@/app/(app)/questions/actions";
import { AppointmentSelect } from "./appointment-select";
import type { AppointmentOption } from "./types";

export function QuestionAddForm({ appointments }: { appointments: AppointmentOption[] }) {
  const [state, action, pending] = useActionState<QuestionFormState, FormData>(addQuestion, { ok: false, error: null });

  // Uncontrolled on purpose: React 19 clears the form after each submit, ready for the next question.
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">New question</span>
        <textarea
          name="question"
          required
          maxLength={300}
          rows={2}
          placeholder="Write it down the moment you think of it…"
          className="mt-1 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="is_priority" className="size-4 accent-[var(--color-brand)]" />
            Must ask
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">For</span>
            <AppointmentSelect name="appointment_id" appointments={appointments} />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden /> {pending ? "Adding…" : "Add question"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}
    </form>
  );
}

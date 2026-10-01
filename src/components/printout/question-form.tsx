"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addQuestion, type FormState } from "@/app/(app)/appointments/print/actions";

export function QuestionForm({ appointmentId }: { appointmentId: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addQuestion, { ok: false, error: null });

  return (
    <form action={action} className="space-y-3">
      {appointmentId && <input type="hidden" name="appointment_id" value={appointmentId} />}
      <label className="block">
        <span className="sr-only">New question</span>
        <textarea
          name="question"
          required
          maxLength={300}
          rows={2}
          placeholder="e.g. Is it safe to keep running 3 times a week?"
          className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="is_priority" className="size-4 accent-[var(--color-brand)]" />
          Must ask (priority)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-ink/90 disabled:opacity-60"
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

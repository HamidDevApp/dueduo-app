"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, MessageSquareText, Star, Trash2 } from "lucide-react";
import {
  answerQuestion,
  assignQuestion,
  deleteQuestion,
  setQuestionPriority,
} from "@/app/(app)/questions/actions";
import { cn } from "@/lib/utils";
import { AppointmentSelect } from "./appointment-select";
import type { AppointmentOption, QuestionRecord } from "./types";

type Props = { q: QuestionRecord; appointments: AppointmentOption[]; addedBy?: string };

export function OpenQuestion({ q, appointments, addedBy }: Props) {
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useOptimistic(q.is_priority);
  const [gone, setGone] = useOptimistic(false);
  const [answering, setAnswering] = useState(false);
  const [answer, setAnswer] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (gone) return null;

  const finish = (text: string | null) =>
    startTransition(async () => {
      setGone(true);
      await answerQuestion(q.id, text);
    });

  // Appointments may have been completed since the question was linked — keep the current value selectable.
  const linkedMissing = q.appointment_id && !appointments.some((a) => a.id === q.appointment_id);

  return (
    <li className={cn("py-4", pending && "opacity-70")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-pressed={priority}
          aria-label={priority ? "Remove from must-ask" : "Mark as must-ask"}
          onClick={() =>
            startTransition(async () => {
              setPriority(!priority);
              await setQuestionPriority(q.id, !priority);
            })
          }
          className="mt-0.5 shrink-0 rounded-md p-0.5 hover:bg-canvas"
        >
          <Star className={cn("size-5", priority ? "fill-brand text-brand" : "text-line")} />
        </button>

        <div className="min-w-0 flex-1">
          <p className={cn(priority && "font-semibold")}>{q.question}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>For</span>
            {linkedMissing ? (
              <span className="rounded-lg bg-canvas px-2 py-1">A past visit</span>
            ) : (
              <AppointmentSelect
                appointments={appointments}
                value={q.appointment_id ?? ""}
                onChange={(v) => startTransition(async () => assignQuestion(q.id, v || null))}
                className="max-w-[19rem] rounded-lg border border-line bg-surface py-1 pr-7 pl-2 text-xs"
              />
            )}
            {addedBy && <span>· Added by {addedBy}</span>}
          </div>

          {answering ? (
            <div className="mt-3 space-y-2">
              <label className="block">
                <span className="text-sm font-medium">What did they say?</span>
                <textarea
                  autoFocus
                  rows={2}
                  maxLength={2000}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="mt-1 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-base outline-none focus:border-brand"
                />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => finish(answer)} className="rounded-lg bg-sage px-3 py-1.5 text-sm font-semibold text-white hover:bg-sage/90">
                  Save answer
                </button>
                <button type="button" onClick={() => setAnswering(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
              <button type="button" onClick={() => setAnswering(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 font-semibold hover:bg-line/60">
                <MessageSquareText className="size-4" aria-hidden /> Add answer
              </button>
              <button type="button" onClick={() => finish(null)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink">
                <Check className="size-4" aria-hidden /> Asked
              </button>
              {confirmDelete ? (
                <button
                  type="button"
                  onBlur={() => setConfirmDelete(false)}
                  onClick={() =>
                    startTransition(async () => {
                      setGone(true);
                      await deleteQuestion(q.id);
                    })
                  }
                  className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-strong hover:bg-brand-soft"
                >
                  Delete?
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete question" className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

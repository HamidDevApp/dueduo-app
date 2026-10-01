"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { answerQuestion, reopenQuestion } from "@/app/(app)/questions/actions";
import type { QuestionRecord } from "./types";

export function AnsweredQuestion({ q }: { q: QuestionRecord }) {
  const [, startTransition] = useTransition();
  const [gone, setGone] = useOptimistic(false);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(q.answer ?? "");

  if (gone) return null;

  return (
    <li className="py-4">
      <p className="font-medium">{q.question}</p>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            autoFocus
            rows={2}
            maxLength={2000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            aria-label="Answer"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-base outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                startTransition(async () => answerQuestion(q.id, answer));
              }}
              className="rounded-lg bg-sage px-3 py-1.5 text-sm font-semibold text-white hover:bg-sage/90"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={q.answer ? "mt-1.5 rounded-xl bg-sage-soft/70 px-3 py-2 text-sm whitespace-pre-line" : "mt-1 text-sm text-muted italic"}>
          {q.answer || "Asked — no answer noted."}
        </p>
      )}
      {!editing && (
        <div className="mt-2 flex gap-1 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink">
            <Pencil className="size-3.5" aria-hidden /> {q.answer ? "Edit answer" : "Add answer"}
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                setGone(true);
                await reopenQuestion(q.id);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Ask again
          </button>
        </div>
      )}
    </li>
  );
}

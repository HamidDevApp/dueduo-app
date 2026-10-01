"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Star } from "lucide-react";
import { setQuestionAsked, setQuestionPriority } from "@/app/(app)/appointments/print/actions";
import { cn } from "@/lib/utils";

type Props = { id: string; question: string; isPriority: boolean; addedBy?: string };

export function QuestionItem({ id, question, isPriority, addedBy }: Props) {
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useOptimistic(isPriority);
  const [asked, setAsked] = useOptimistic(false);

  if (asked) return null;

  return (
    <li className={cn("flex items-start gap-3 py-3", pending && "opacity-70")}>
      <button
        type="button"
        aria-pressed={priority}
        aria-label={priority ? "Remove from priority" : "Mark as priority"}
        onClick={() =>
          startTransition(async () => {
            setPriority(!priority);
            await setQuestionPriority(id, !priority);
          })
        }
        className="mt-0.5 shrink-0 rounded-md p-0.5 hover:bg-canvas"
      >
        <Star className={cn("size-5", priority ? "fill-brand text-brand" : "text-line")} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", priority && "font-semibold")}>{question}</p>
        {addedBy && <p className="mt-0.5 text-xs text-muted">Added by {addedBy}</p>}
      </div>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setAsked(true);
            await setQuestionAsked(id, true);
          })
        }
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-canvas hover:text-ink"
      >
        <Check className="size-3.5" aria-hidden /> Asked
      </button>
    </li>
  );
}

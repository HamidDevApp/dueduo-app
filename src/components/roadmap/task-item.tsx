"use client";

import Link from "next/link";
import { useId, useOptimistic, useState, useTransition } from "react";
import { ArrowRight, Check, Clock, Sparkles, Star } from "lucide-react";
import { reassignTask, setTaskDone } from "@/app/(app)/roadmap/actions";
import { CATEGORY_LABELS, type Owner, type RoadmapTask } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { ScriptSheet } from "./script-sheet";
import type { OwnerLabels, TaskActionView } from "./types";

type Props = {
  task: RoadmapTask;
  done: boolean;
  owner: Owner;
  labels: OwnerLabels;
  action: TaskActionView | null;
  /** e.g. "From weeks 9–10" on the catch-up list */
  context?: string;
};

const OWNER_STYLES: Record<Owner, string> = {
  mom: "bg-brand-soft text-brand-strong",
  partner: "bg-sage-soft text-sage",
  together: "bg-canvas text-ink",
};

export function TaskItem({ task, done, owner, labels, action, context }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [optimisticOwner, setOptimisticOwner] = useOptimistic(owner);
  const [error, setError] = useState<string | null>(null);
  const selectId = useId(); // the same task can render in two lists (e.g. "This week" + "Catch up")

  function toggle() {
    const next = !optimisticDone;
    setError(null);
    startTransition(async () => {
      setOptimisticDone(next);
      const res = await setTaskDone(task.key, next);
      if (!res.ok) setError(res.error);
    });
  }

  function reassign(next: Owner) {
    setError(null);
    startTransition(async () => {
      setOptimisticOwner(next);
      const res = await reassignTask(task.key, next);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className={cn("flex gap-3 py-4 transition-opacity", pending && "opacity-70")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        aria-label={`Mark "${task.title}" as ${optimisticDone ? "not done" : "done"}`}
        onClick={toggle}
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          optimisticDone ? "border-sage bg-sage text-white" : "border-line hover:border-sage",
        )}
      >
        {optimisticDone && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", optimisticDone && "text-muted line-through")}>
          {task.title}
          {task.essential && !optimisticDone && (
            <Star className="ml-1.5 inline size-3.5 fill-brand text-brand" aria-label="Essential" />
          )}
        </p>

        {!optimisticDone && (
          <>
            <p className="mt-1 text-sm text-muted">{task.detail}</p>
            {task.why && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink/80">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                {task.why}
              </p>
            )}
          </>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <label className="sr-only" htmlFor={selectId}>
            Assigned to
          </label>
          <select
            id={selectId}
            value={optimisticOwner}
            onChange={(e) => reassign(e.target.value as Owner)}
            className={cn(
              "cursor-pointer rounded-full border-0 py-1 pr-7 pl-2.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand",
              OWNER_STYLES[optimisticOwner],
            )}
          >
            {(Object.keys(labels) as Owner[]).map((o) => (
              <option key={o} value={o}>
                {labels[o]}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="size-3.5" aria-hidden /> ~{task.minutes} min
          </span>
          <span className="text-muted">· {CATEGORY_LABELS[task.category]}</span>
          {context && <span className="text-muted">· {context}</span>}
        </div>

        {action && !optimisticDone && (
          <div className="mt-3">
            {action.kind === "link" ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-1.5 text-sm font-semibold text-brand hover:text-brand-strong"
              >
                {action.label} <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <ScriptSheet label={action.label} title={action.title} text={action.text} tip={action.tip} />
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-2 text-sm text-brand-strong">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

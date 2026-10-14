import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RoadmapTask } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { MarkDoneButton } from "./mark-done-button";

/**
 * "Your first steps" on Today (owner only). Hides itself once all 3 steps are done.
 * Step 1 (due date) is always done here: the app only opens Today once a due date is set.
 */
export function FirstStepsCard({
  partnerName,
  partnerJoined,
  firstTaskDone,
  suggestedTask,
}: {
  partnerName: string | null;
  partnerJoined: boolean;
  firstTaskDone: boolean;
  suggestedTask: RoadmapTask | null;
}) {
  const done = 1 + Number(partnerJoined) + Number(firstTaskDone);
  if (done === 3) return null;

  return (
    <Card className="bg-brand-soft/60">
      <h2 className="font-display text-xl">Your first steps</h2>
      <p className="mt-1 text-sm text-muted">
        Three steps and your plan works for both of you. {done} of 3 done.
      </p>
      <ol className="mt-4 space-y-4">
        <Step done title="Add your due date" detail="Done. Everything is planned around it." />
        {partnerJoined ? (
          <Step done title={`${partnerName || "Your partner"} has joined.`} />
        ) : (
          <Step
            title={`Invite ${partnerName || "your partner"} as Co-Pilot`}
            detail="They get their own task list and join free."
          >
            <Link
              href="/co-pilot"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep"
            >
              Invite now <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Step>
        )}
        {firstTaskDone ? (
          <Step done title="First task done. Small wins count." />
        ) : (
          <Step
            title="Tick off your first task"
            detail={
              suggestedTask ? `An easy one from this week: "${suggestedTask.title}"` : "Pick one from this week's list."
            }
          >
            {suggestedTask && <MarkDoneButton taskKey={suggestedTask.key} />}
            <Link href="/roadmap" className="text-sm font-semibold text-brand-strong underline-offset-2 hover:underline">
              See this week
            </Link>
          </Step>
        )}
      </ol>
    </Card>
  );
}

function Step({
  done = false,
  title,
  detail,
  children,
}: {
  done?: boolean;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
          done ? "border-sage bg-sage text-white" : "border-ink/25 bg-surface",
        )}
      >
        {done && <Check className="size-3" strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", done && "text-muted")}>
          <span className="sr-only">{done ? "Done: " : "To do: "}</span>
          {title}
        </p>
        {detail && <p className="text-sm text-muted">{detail}</p>}
        {children && <div className="mt-2 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </li>
  );
}

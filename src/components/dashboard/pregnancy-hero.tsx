import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { PregnancyStatus } from "@/lib/pregnancy";

export function PregnancyHero({ status }: { status: PregnancyStatus | null }) {
  if (!status) {
    return (
      <Card className="bg-brand-soft/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl">Let&apos;s set up your pregnancy</h1>
            <p className="mt-1 text-sm text-muted">
              Add your due date and we&apos;ll build your week-by-week plan.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Add due date <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
            <Sparkles className="size-3.5" /> Trimester {status.trimester}
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Week {status.week}
            {status.day > 0 && (
              <span className="text-2xl text-muted sm:text-3xl"> + {status.day}d</span>
            )}
          </h1>
        </div>
        <div className="sm:text-right">
          <p className="font-display text-3xl text-brand">{status.daysToGo}</p>
          <p className="text-sm text-muted">days to go</p>
        </div>
      </div>
      <ProgressBar value={status.progress} label="Pregnancy progress" className="mt-6" />
      <p className="mt-2 text-xs text-muted">{status.progress}% of the way there</p>
    </Card>
  );
}

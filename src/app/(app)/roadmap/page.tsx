import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HeartHandshake, Leaf } from "lucide-react";
import { TaskList } from "@/components/roadmap/task-list";
import { UrgentSigns } from "@/components/roadmap/urgent-signs";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getPregnancyStatus, type Trimester } from "@/lib/pregnancy";
import {
  ALL_TASKS,
  ROADMAP,
  TRIMESTERS,
  getOverdueTasks,
  getProgress,
  getStageForWeek,
  getStagesByTrimester,
  getUpcomingStages,
  toStateMap,
  type RoadmapStage,
  type TaskState,
} from "@/lib/roadmap";
import { dueMonthLabel } from "@/lib/scripts";
import { getSpace } from "@/lib/space";
import { cn } from "@/lib/utils";
import { buildRows, ownerLabels, scriptVars, type Who } from "./view-model";

export const metadata: Metadata = { title: "Roadmap" };

const weeksLabel = (s: RoadmapStage) =>
  s.fromWeek === s.toWeek ? `Week ${s.fromWeek}` : `Weeks ${Math.max(s.fromWeek, 1)}–${s.toWeek}`;

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; t?: string }>;
}) {
  const params = await searchParams;
  const { supabase, ownerId, role, profile } = await getSpace();

  const { data } = await supabase
    .from("roadmap_progress")
    .select("task_key, assignee, completed_at")
    .eq("user_id", ownerId);

  const states = toStateMap(data as TaskState[] | null);
  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const week = status?.week ?? 0;
  const current = getStageForWeek(week);
  const next = getUpcomingStages(week, 1)[0];
  const overdue = getOverdueTasks(week, states);

  const who: Who = params.who === "mine" || params.who === "theirs" ? params.who : "all";
  const trimester = (["1", "2", "3"].includes(params.t ?? "") ? Number(params.t) : current.trimester) as Trimester;

  const labels = ownerLabels(role, profile);
  const vars = scriptVars(profile, dueMonthLabel(profile?.due_date));
  const rows = (tasks: typeof ALL_TASKS, context?: (t: (typeof ALL_TASKS)[number]) => string | undefined) =>
    buildRows(tasks, states, vars, { role, who, context });

  const stageOf = new Map(ROADMAP.flatMap((s) => s.tasks.map((t) => [t.key, s] as const)));
  const overall = getProgress(ALL_TASKS, states);
  const currentProgress = getProgress(current.tasks, states);

  const href = (q: { who?: Who; t?: number }) => {
    const sp = new URLSearchParams();
    const w = q.who ?? who;
    const tri = q.t ?? trimester;
    if (w !== "all") sp.set("who", w);
    if (tri !== current.trimester) sp.set("t", String(tri));
    const s = sp.toString();
    return s ? `/roadmap?${s}` : "/roadmap";
  };

  const filters: { id: Who; label: string }[] = [
    { id: "all", label: "Everyone" },
    { id: "mine", label: "Mine" },
    { id: "theirs", label: role === "owner" ? `${labels.partner}'s` : `${labels.mom}'s` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-sm font-medium text-muted">
          {weeksLabel(current)} · {TRIMESTERS[current.trimester].title}
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">{current.title}</h1>
        <p className="mt-1 text-muted">{current.focus}</p>
        <div className="mt-4 max-w-md">
          <ProgressBar value={overall.percent} label="Whole roadmap progress" tone="sage" />
          <p className="mt-1.5 text-xs text-muted">
            {overall.done} of {overall.total} tasks done across the whole pregnancy
          </p>
        </div>
      </header>

      {/* Peace of mind */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex gap-3 bg-sage-soft/70">
          <Leaf className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden />
          <p className="text-sm leading-relaxed">{current.reassurance}</p>
        </Card>
        <Card className="flex gap-3">
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {role === "owner" ? `${labels.partner}'s focus` : "Your focus as Co-Pilot"}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{current.partnerFocus}</p>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <nav aria-label="Filter tasks" className="flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={href({ who: f.id })}
            aria-current={who === f.id ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              who === f.id ? "bg-ink text-canvas" : "bg-surface text-muted hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {/* This stage */}
      <Card>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">This week</h2>
          <p className="text-sm text-muted">
            {currentProgress.done}/{currentProgress.total} done
          </p>
        </div>
        <TaskList rows={rows(current.tasks)} labels={labels} empty="Nothing here for this filter — enjoy the breather." />
      </Card>

      {/* Catch up */}
      {overdue.length > 0 && (
        <details className="group rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span>
              <span className="font-display text-xl">Catch up</span>
              <span className="ml-2 text-sm text-muted">{overdue.length} from earlier weeks</span>
            </span>
            <ChevronDown className="size-5 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="mt-2 text-sm text-muted">
            No stress — some of these may not apply to you. Tick them off or reassign them.
          </p>
          <TaskList
            rows={rows(overdue, (t) => {
              const s = stageOf.get(t.key);
              return s ? `From ${weeksLabel(s).toLowerCase()}` : undefined;
            })}
            labels={labels}
            empty="All caught up for this filter."
          />
        </details>
      )}

      {/* Coming up */}
      {next && (
        <Card className="bg-canvas">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Coming up · {weeksLabel(next)}
          </p>
          <p className="mt-1 font-display text-xl">{next.title}</p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {next.tasks.slice(0, 4).map((t) => (
              <li key={t.key}>· {t.title}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Full roadmap */}
      <section aria-labelledby="full-roadmap">
        <h2 id="full-roadmap" className="font-display text-2xl">
          Full roadmap
        </h2>
        <nav aria-label="Trimester" className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
          {([1, 2, 3] as const).map((t) => (
            <Link
              key={t}
              href={href({ t })}
              aria-current={trimester === t ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-center text-sm font-semibold",
                trimester === t ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-ink",
              )}
            >
              {TRIMESTERS[t].title.split(" ")[0]}
              <span className="block text-xs font-normal">{TRIMESTERS[t].weeks}</span>
            </Link>
          ))}
        </nav>
        <p className="mt-3 text-sm text-muted">{TRIMESTERS[trimester].summary}</p>

        <div className="mt-4 space-y-3">
          {getStagesByTrimester(trimester).map((stage) => {
            const p = getProgress(stage.tasks, states);
            const isCurrent = stage.id === current.id;
            return (
              <details
                key={stage.id}
                className="group rounded-[var(--radius-card)] border border-line bg-surface p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-muted">
                      {weeksLabel(stage)}
                      {isCurrent && <span className="ml-2 text-brand">● You are here</span>}
                    </span>
                    <span className="block font-semibold">{stage.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-muted">
                      {p.done}/{p.total}
                    </span>
                    <ChevronDown className="size-5 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                </summary>
                <TaskList rows={rows(stage.tasks)} labels={labels} empty="No tasks for this filter in this stage." />
              </details>
            );
          })}
        </div>
      </section>

      <UrgentSigns />
    </div>
  );
}

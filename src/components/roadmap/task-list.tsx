import { TaskItem } from "./task-item";
import type { OwnerLabels, TaskActionView } from "./types";
import type { Owner, RoadmapTask } from "@/lib/roadmap";

export type TaskRow = {
  task: RoadmapTask;
  done: boolean;
  owner: Owner;
  action: TaskActionView | null;
  context?: string;
};

export function TaskList({ rows, labels, empty }: { rows: TaskRow[]; labels: OwnerLabels; empty: string }) {
  if (rows.length === 0) return <p className="py-4 text-sm text-muted">{empty}</p>;

  // Open tasks first, finished ones sink to the bottom
  const sorted = [...rows].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <ul className="divide-y divide-line">
      {sorted.map((r) => (
        <TaskItem key={r.task.key} {...r} labels={labels} />
      ))}
    </ul>
  );
}

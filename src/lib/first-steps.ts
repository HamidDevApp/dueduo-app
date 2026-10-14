import { getStageForWeek, type RoadmapTask, type TaskStateMap } from "@/lib/roadmap";

/**
 * "Your first steps": the easy task we suggest — the current stage's hand-picked `quickWin` task,
 * while it's still open. Null when the stage has none or it's done (no fallback pick).
 */
export function pickQuickTask(week: number, states: TaskStateMap): RoadmapTask | null {
  const task = getStageForWeek(week).tasks.find((t) => t.quickWin);
  return task && !states.get(task.key)?.completed_at ? task : null;
}

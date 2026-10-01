import type { TaskRow } from "@/components/roadmap/task-list";
import type { OwnerLabels, TaskActionView } from "@/components/roadmap/types";
import { isDone, resolveOwner, type RoadmapTask, type TaskStateMap } from "@/lib/roadmap";
import { SCRIPTS, renderScript, type ScriptVars } from "@/lib/scripts";
import type { SpaceProfile, SpaceRole } from "@/lib/space";

export type Who = "all" | "mine" | "theirs";

/** Owner labels as the viewer should see them. */
export function ownerLabels(role: SpaceRole, profile: SpaceProfile | null): OwnerLabels {
  return role === "owner"
    ? { mom: "You", partner: profile?.partner_name || "Partner", together: "Together" }
    : { mom: profile?.full_name || "Mom", partner: "You", together: "Together" };
}

export function scriptVars(profile: SpaceProfile | null, dueMonth: string | null): ScriptVars {
  return {
    myName: profile?.full_name,
    partnerName: profile?.partner_name,
    dueMonth,
    hospital: profile?.hospital_name,
  };
}

function actionView(task: RoadmapTask, vars: ScriptVars): TaskActionView | null {
  const a = task.action;
  if (!a) return null;
  if (a.type === "link") return { kind: "link", href: a.href, label: a.label };

  // The invite message needs a live link, which lives on the Co-Pilot page.
  if (a.scriptId === "partner-invite") return { kind: "link", href: "/co-pilot", label: "Open invite" };

  const script = SCRIPTS[a.scriptId];
  return {
    kind: "script",
    label: a.label,
    title: script.title,
    text: renderScript(script.body, vars),
    tip: script.tip,
  };
}

export function buildRows(
  tasks: RoadmapTask[],
  states: TaskStateMap,
  vars: ScriptVars,
  opts: { role: SpaceRole; who: Who; context?: (t: RoadmapTask) => string | undefined },
): TaskRow[] {
  const me = opts.role === "owner" ? "mom" : "partner";
  const them = opts.role === "owner" ? "partner" : "mom";

  return tasks
    .map((task) => ({
      task,
      done: isDone(task, states),
      owner: resolveOwner(task, states),
      action: actionView(task, vars),
      context: opts.context?.(task),
    }))
    .filter((r) => {
      if (opts.who === "mine") return r.owner === me || r.owner === "together";
      if (opts.who === "theirs") return r.owner === them || r.owner === "together";
      return true;
    });
}

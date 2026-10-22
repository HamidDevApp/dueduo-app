import { PREGNANCY_DAYS, dueDateFromLmp, isIsoDate } from "@/lib/pregnancy";
import { OWNER_LABELS, getStageForWeek, type RoadmapStage } from "@/lib/roadmap";

export const PLAN_PATH = "/plan";
export const PLAN_WINDOW_WEEKS = 4;
export const PLAN_LAST_WEEK = 42;

export type PlanMode = "due" | "lmp";

export const PLAN_COPY = {
  lede: "Put in your due date and you'll see the next 4 weeks split three ways: you, your partner, and together.",
  questionnaireLabel: "What do you have?",
  modeDue: "Due date",
  modeLmp: "Last period",
  dueLabel: "Your due date",
  lmpLabel: "First day of your last period",
  lmpNote: "We'll work out your due date from the first day of your last period.",
  submit: "Show our plan",
  weekEyebrow: "This week",
  weekLabel: (week: number) => `Week ${week}`,
  emptyColumn: "Nothing at this stage.",
  shareHeading: "Send it to your partner",
  shareNote: "Send the list, or send dueduo.com/plan so they can put in the due date themselves.",
  copyButton: "Copy the list",
  copiedButton: "Copied",
  whatsappButton: "Send on WhatsApp",
  upgradeHeading: "Keep it going in DueDuo",
  upgradeBody:
    "In DueDuo you each get your own list, tick things off, and see what the other one has done. Many tasks come with what you need ready to go: messages to send, questions to ask, and the budget and leave plan.",
  smallPrint: "Nothing you type is saved. This is general guidance, not medical advice.",
  errors: {
    empty: "Please enter a date.",
    invalid: "That date doesn't look right. Check the day, month and year.",
    range: "That date is outside pregnancy weeks 0 to 42.",
  },
} as const;

const DAY_MS = 86_400_000;

function daysFromToday(iso: string, now = new Date()) {
  const [y, m, d] = iso.split("-").map(Number);
  const value = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((value - today) / DAY_MS);
}

export function parsePlanDate(
  mode: PlanMode,
  value: string,
  now = new Date(),
): { ok: true; dueDate: string; daysToGo: number } | { ok: false; error: string } {
  if (!value.trim()) return { ok: false, error: PLAN_COPY.errors.empty };
  if (!isIsoDate(value)) return { ok: false, error: PLAN_COPY.errors.invalid };

  const offset = daysFromToday(value, now);

  if (mode === "due") {
    if (offset < -14 || offset > PREGNANCY_DAYS) return { ok: false, error: PLAN_COPY.errors.range };
    return { ok: true, dueDate: value, daysToGo: offset };
  }

  if (offset > 0 || offset < -(PREGNANCY_DAYS + 14)) return { ok: false, error: PLAN_COPY.errors.range };
  return { ok: true, dueDate: dueDateFromLmp(value), daysToGo: PREGNANCY_DAYS + offset };
}

export function planWeeks(week: number) {
  const first = Math.min(Math.max(week, 0), PLAN_LAST_WEEK);
  return Array.from({ length: PLAN_WINDOW_WEEKS }, (_, i) => Math.min(first + i, PLAN_LAST_WEEK));
}

export function planStages(week: number) {
  const seen = new Set<string>();
  const stages: RoadmapStage[] = [];

  for (const w of planWeeks(week)) {
    const stage = getStageForWeek(w);
    if (seen.has(stage.id)) continue;
    seen.add(stage.id);
    stages.push(stage);
  }

  return stages;
}

export function stageHeading(stage: RoadmapStage) {
  const label = stage.fromWeek === stage.toWeek ? `Week ${stage.fromWeek}` : `Weeks ${stage.fromWeek}–${stage.toWeek}`;
  return `${label} · ${stage.title.replace(/^Week \d+ — /, "")}`;
}

export function daysToGoLabel(daysToGo: number) {
  if (daysToGo > 0) return daysToGo === 1 ? "1 day to go" : `${daysToGo} days to go`;
  return daysToGo === 0 ? "Due today" : "Your due date has passed";
}

const OWNER_ORDER = ["mom", "partner", "together"] as const;

export function formatShareText(stages: RoadmapStage[]) {
  const lines: string[] = [];

  for (const stage of stages) {
    if (lines.length) lines.push("");
    lines.push(stageHeading(stage));

    for (const owner of OWNER_ORDER) {
      const tasks = stage.tasks.filter((task) => task.owner === owner);
      if (!tasks.length) continue;
      lines.push("", OWNER_LABELS[owner]);
      for (const task of tasks) lines.push(`- ${task.title}`);
    }
  }

  lines.push("", "Made with dueduo.com/plan");
  return lines.join("\n");
}

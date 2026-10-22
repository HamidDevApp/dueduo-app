"use client";

import { useId, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { CheckoutLink } from "@/components/checkout-link";
import { PackSignup } from "@/components/guides/pack-signup";
import {
  PLAN_COPY,
  daysToGoLabel,
  formatShareText,
  parsePlanDate,
  planStages,
  stageHeading,
  type PlanMode,
} from "@/lib/plan";
import { getPregnancyStatus, type PregnancyStatus } from "@/lib/pregnancy";
import { OWNER_LABELS, TRIMESTERS, getStageForWeek, type Owner, type RoadmapStage } from "@/lib/roadmap";
import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const OWNER_ORDER: Owner[] = ["mom", "partner", "together"];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand";

type Plan = { status: PregnancyStatus; daysToGo: number; stages: RoadmapStage[] };

export function PlanForTwo() {
  const dateId = useId();
  const noteId = useId();
  const [mode, setMode] = useState<PlanMode>("due");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [copied, setCopied] = useState(false);

  function chooseMode(next: PlanMode) {
    if (next === mode) return;
    setMode(next);
    setValue("");
    setError(null);
    setPlan(null);
    setCopied(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = parsePlanDate(mode, value);

    if (!result.ok) {
      setError(result.error);
      setPlan(null);
      return;
    }

    const status = getPregnancyStatus(result.dueDate);
    setPlan({ status, daysToGo: result.daysToGo, stages: planStages(status.week) });
    setError(null);
    setCopied(false);
  }

  async function copyList() {
    if (!plan) return;
    const text = formatShareText(plan.stages);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    if (!plan) return;
    const text = encodeURIComponent(formatShareText(plan.stages));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  const currentStage = plan ? getStageForWeek(plan.status.week) : null;

  return (
    <div>
      <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <fieldset>
          <legend className="text-sm font-semibold">{PLAN_COPY.questionnaireLabel}</legend>
          <div className="mt-2 inline-flex rounded-full border border-line bg-canvas p-1">
            {(["due", "lmp"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => chooseMode(option)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  mode === option ? "bg-ink text-canvas" : "text-muted hover:text-ink",
                )}
              >
                {option === "due" ? PLAN_COPY.modeDue : PLAN_COPY.modeLmp}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor={dateId} className="text-sm font-semibold">
            {mode === "due" ? PLAN_COPY.dueLabel : PLAN_COPY.lmpLabel}
          </label>
          <input
            id={dateId}
            type="date"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-describedby={mode === "lmp" ? noteId : undefined}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
          {mode === "lmp" && (
            <p id={noteId} className="mt-1.5 text-xs text-muted">
              {PLAN_COPY.lmpNote}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-strong px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-strong/20 transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong sm:w-auto"
        >
          {PLAN_COPY.submit}
        </button>
      </form>

      {plan && currentStage && (
        <div>
          <div className="mt-8 rounded-[var(--radius-card)] bg-brand-soft/60 p-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-sage uppercase">{PLAN_COPY.weekEyebrow}</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{PLAN_COPY.weekLabel(plan.status.week)}</p>
            <p className="mt-1 text-sm text-muted">
              {TRIMESTERS[plan.status.trimester].title} · {daysToGoLabel(plan.daysToGo)}
            </p>
            <p className="mt-4 leading-relaxed text-ink">{currentStage.reassurance}</p>
          </div>

          {plan.stages.map((stage) => (
            <section key={stage.id} className="mt-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight">{stageHeading(stage)}</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {OWNER_ORDER.map((owner) => {
                  const tasks = stage.tasks.filter((task) => task.owner === owner);
                  return (
                    <div key={owner} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                      <h3 className="text-xs font-semibold tracking-[0.18em] text-sage uppercase">
                        {OWNER_LABELS[owner]}
                      </h3>
                      {tasks.length ? (
                        <ul className="mt-3 space-y-4">
                          {tasks.map((task) => (
                            <li key={task.key}>
                              <p className="text-sm leading-snug font-semibold">{task.title}</p>
                              <p className="mt-1 text-sm leading-relaxed text-muted">{task.detail}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-muted">{PLAN_COPY.emptyColumn}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-10 rounded-[var(--radius-card)] border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{PLAN_COPY.shareHeading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{PLAN_COPY.shareNote}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copyList}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-canvas px-5 py-3 text-sm font-semibold transition-colors hover:bg-brand-soft/60"
              >
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? PLAN_COPY.copiedButton : PLAN_COPY.copyButton}
              </button>
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-ink/90"
              >
                <MessageCircle className="size-4" aria-hidden />
                {PLAN_COPY.whatsappButton}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[var(--radius-card)] bg-brand-soft/60 p-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{PLAN_COPY.upgradeHeading}</h2>
            <p className="mt-2 leading-relaxed text-ink/85">{PLAN_COPY.upgradeBody}</p>
            <CheckoutLink
              from="plan"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-strong px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-strong/20 transition-colors hover:bg-brand-deep"
            >
              Start our plan — {SITE.price}
            </CheckoutLink>
          </div>
        </div>
      )}

      <div className="mt-10">
        <PackSignup source="plan" />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">{PLAN_COPY.smallPrint}</p>
    </div>
  );
}

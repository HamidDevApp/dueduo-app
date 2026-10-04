"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarSearch, Check, Users } from "lucide-react";
import { completeOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CURRENCIES, estimateLeavePlan } from "@/lib/money";
import { dueDateFromLmp, getPregnancyStatus, validateDueDate, validateLmp } from "@/lib/pregnancy";
import { cn, formatLongDate, formatMoney } from "@/lib/utils";

type Mode = "due" | "lmp";
type Range = { min: string; max: string };

type Defaults = {
  dueDate: string;
  fullName: string;
  partnerName: string;
  hospitalName: string;
  currency: string;
  momIncome: string;
  partnerIncome: string;
  leaveWeeks: string;
  paidWeeks: string;
  payPercent: string;
  partnerLeaveWeeks: string;
  workStatus: string;
  visitorPolicy: string;
};

type Props = { limits: { due: Range; lmp: Range }; defaults: Defaults; needsConsent: boolean };

const STEPS = [
  { title: "Your due date", hint: "Everything is planned around this one date." },
  { title: "Your team", hint: "Share the load — your partner gets their own tasks." },
  { title: "Leave & money", hint: "Optional. We'll turn it into a calm savings plan." },
  { title: "Your boundaries", hint: "We'll prepare the awkward messages for you." },
] as const;

const WORK_OPTIONS = [
  { value: "not_yet", label: "Not yet", hint: "We'll give you a script and timing tips." },
  { value: "told", label: "Already told them", hint: "We'll focus on leave paperwork." },
  { value: "not_applicable", label: "Doesn't apply", hint: "Self-employed or not working." },
];

const VISITOR_OPTIONS = [
  { value: "welcome", label: "Visitors welcome", hint: "Friendly guidelines for everyone." },
  { value: "limited", label: "Limited visits", hint: "Message first, short visits, clean hands." },
  { value: "none_first_weeks", label: "Just us at first", hint: "No hospital visitors, home visits later." },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand";

const initialState: OnboardingState = { error: null };

export function OnboardingWizard({ limits, defaults, needsConsent }: Props) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const [step, setStep] = useState(0);

  // Jump back to the step the server flagged (setState during render is the React-endorsed pattern).
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.step !== undefined) setStep(state.step);
  }

  // Controlled fields — React 19 resets uncontrolled forms after an action.
  const [mode, setMode] = useState<Mode>("due");
  const [f, setF] = useState(defaults);
  const [invitePartner, setInvitePartner] = useState(true);
  const set = (key: keyof Defaults) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }));

  // Live due-date preview (same maths as the server)
  const date = f.dueDate;
  const dateError = date ? (mode === "due" ? validateDueDate(date) : validateLmp(date)) : null;
  const dueDate = date && !dateError ? (mode === "due" ? date : dueDateFromLmp(date)) : null;
  const status = dueDate ? getPregnancyStatus(dueDate) : null;

  // Live leave-plan preview
  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const leavePlan = status
    ? estimateLeavePlan(
        { monthlyIncome: n(f.momIncome), leaveWeeks: n(f.leaveWeeks), paidWeeks: n(f.paidWeeks), payPercent: n(f.payPercent) },
        status.daysToGo,
      )
    : null;

  const isLast = step === STEPS.length - 1;
  const canContinue = step !== 0 || Boolean(dueDate);
  const error = step === 0 ? (dateError ?? state.error) : state.error;

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setF((prev) => ({ ...prev, dueDate: next === "due" ? defaults.dueDate : "" }));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Enter on early steps moves forward instead of submitting the whole form.
    if (e.key === "Enter" && !isLast && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      if (canContinue) setStep((s) => s + 1);
    }
  }

  const partnerLabel = f.partnerName.trim() || "your partner";

  return (
    <form action={formAction} onKeyDown={onKeyDown} className="space-y-5">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <p className="font-semibold">{STEPS[step].title}</p>
          <p className="text-muted">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <ProgressBar value={((step + 1) / STEPS.length) * 100} label="Setup progress" />
        <p className="mt-2 text-sm text-muted">{STEPS[step].hint}</p>
      </div>

      {/* ---------- STEP 1: DUE DATE ---------- */}
      <Card className={cn("space-y-5", step !== 0 && "hidden")}>
        <input type="hidden" name="mode" value={mode} />
        <div role="radiogroup" aria-label="How to set your due date" className="grid grid-cols-2 gap-2 rounded-xl bg-canvas p-1">
          {(
            [
              { id: "due", label: "I know my due date", icon: CalendarCheck },
              { id: "lmp", label: "Calculate it for me", icon: CalendarSearch },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              onClick={() => switchMode(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                mode === id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">
            {mode === "due" ? "Estimated due date" : "First day of your last period"}
          </span>
          <input
            type="date"
            name="date"
            min={limits[mode].min}
            max={limits[mode].max}
            value={f.dueDate}
            onChange={set("dueDate")}
            aria-invalid={Boolean(dateError)}
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted">
            {mode === "due"
              ? "Use the date from your doctor, midwife or dating scan."
              : "We add 280 days (40 weeks). Your dating scan may adjust it — you can update it anytime."}
          </span>
        </label>

        {status && dueDate && (
          <div aria-live="polite" className="rounded-xl bg-sage-soft p-4">
            <p className="text-xs font-semibold tracking-wide text-sage uppercase">Your plan</p>
            <p className="mt-1 font-display text-xl">Due {formatLongDate(dueDate)}</p>
            <p className="mt-1 text-sm text-muted">
              You&apos;re{" "}
              <strong className="text-ink">
                {status.week} weeks{status.day > 0 && ` ${status.day} days`}
              </strong>{" "}
              · Trimester {status.trimester} · {status.daysToGo} days to go
            </p>
          </div>
        )}
      </Card>

      {/* ---------- STEP 2: TEAM ---------- */}
      <Card className={cn("space-y-4", step !== 1 && "hidden")}>
        <label className="block">
          <span className="text-sm font-medium">Your first name</span>
          <input name="full_name" autoComplete="given-name" maxLength={80} value={f.fullName} onChange={set("fullName")} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Partner or main support person</span>
          <input name="partner_name" maxLength={80} value={f.partnerName} onChange={set("partnerName")} className={inputClass} />
        </label>

        <label
          className={cn(
            "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
            invitePartner ? "border-brand bg-brand-soft/50" : "border-line",
          )}
        >
          <input
            type="checkbox"
            name="invite_partner"
            checked={invitePartner}
            onChange={(e) => setInvitePartner(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-brand)]"
          />
          <span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Users className="size-4 text-brand" aria-hidden /> Turn on Co-Pilot mode
            </span>
            <span className="mt-1 block text-sm text-muted">
              {partnerLabel === "your partner" ? "Your partner" : partnerLabel} gets a login and their own task
              list — car seat, bookings, visitor messages and more — so you&apos;re not the one remembering
              everything.
            </span>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Hospital or birth center</span>
          <input name="hospital_name" maxLength={120} value={f.hospitalName} onChange={set("hospitalName")} placeholder="Not decided yet? Leave blank." className={inputClass} />
        </label>
      </Card>

      {/* ---------- STEP 3: LEAVE & MONEY ---------- */}
      <Card className={cn("space-y-4", step !== 2 && "hidden")}>
        <label className="block">
          <span className="text-sm font-medium">Currency</span>
          <select name="currency" value={f.currency} onChange={set("currency")} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Your monthly take-home</span>
            <input name="mom_monthly_income" type="number" inputMode="decimal" min={0} step="any" value={f.momIncome} onChange={set("momIncome")} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Partner&apos;s monthly take-home</span>
            <input name="partner_monthly_income" type="number" inputMode="decimal" min={0} step="any" value={f.partnerIncome} onChange={set("partnerIncome")} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Your total leave (weeks)</span>
            <input name="mom_leave_weeks" type="number" inputMode="numeric" min={0} max={104} value={f.leaveWeeks} onChange={set("leaveWeeks")} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Of which paid (weeks)</span>
            <input name="mom_paid_weeks" type="number" inputMode="numeric" min={0} max={104} value={f.paidWeeks} onChange={set("paidWeeks")} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Pay during paid leave (%)</span>
            <input name="mom_leave_pay_percent" type="number" inputMode="numeric" min={0} max={100} value={f.payPercent} onChange={set("payPercent")} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Partner&apos;s leave (weeks)</span>
            <input name="partner_leave_weeks" type="number" inputMode="numeric" min={0} max={104} value={f.partnerLeaveWeeks} onChange={set("partnerLeaveWeeks")} className={inputClass} />
          </label>
        </div>

        {leavePlan ? (
          <div aria-live="polite" className="rounded-xl bg-sage-soft p-4">
            <p className="text-xs font-semibold tracking-wide text-sage uppercase">Your leave plan</p>
            {leavePlan.incomeGap > 0 ? (
              <>
                <p className="mt-1 font-display text-xl">
                  {formatMoney(leavePlan.incomeGap, f.currency)} income gap
                </p>
                <p className="mt-1 text-sm text-muted">
                  {leavePlan.monthlySavingsTarget
                    ? `Setting aside ${formatMoney(leavePlan.monthlySavingsTarget, f.currency)}/month until your due date covers it.`
                    : "Your due date is close — we'll help you trim costs instead."}
                  {leavePlan.unpaidWeeks > 0 && ` Includes ${leavePlan.unpaidWeeks} unpaid weeks.`}
                </p>
              </>
            ) : (
              <p className="mt-1 font-display text-xl">Fully covered — nice! 🎉</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Only you can see these numbers (and your partner, if you invite them). Skip anything you&apos;re not sure about.
          </p>
        )}
      </Card>

      {/* ---------- STEP 4: BOUNDARIES ---------- */}
      <Card className={cn("space-y-5", step !== 3 && "hidden")}>
        <ChoiceGroup
          legend="Have you told work yet?"
          name="work_status"
          value={f.workStatus}
          onChange={(v) => setF((p) => ({ ...p, workStatus: v }))}
          options={WORK_OPTIONS}
        />
        <ChoiceGroup
          legend="Visitors after the birth"
          name="visitor_policy"
          value={f.visitorPolicy}
          onChange={(v) => setF((p) => ({ ...p, visitorPolicy: v }))}
          options={VISITOR_OPTIONS}
        />
        <p className="text-xs text-muted">
          You can change these anytime. {f.partnerName.trim() || "Your partner"} can send the visitor messages for you.
        </p>

        {needsConsent && (
          <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-canvas/60 p-4 text-sm leading-relaxed">
            <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[var(--color-brand)]" />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" className="font-semibold underline underline-offset-2">Terms</a> and{" "}
              <a href="/privacy" target="_blank" className="font-semibold underline underline-offset-2">Privacy Policy</a>, and
              I consent to DueDuo storing my pregnancy details (health information) to run my planner. I can withdraw
              this anytime by deleting my account.
            </span>
          </label>
        )}
      </Card>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-strong">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-3.5 font-semibold hover:bg-canvas"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
        )}

        {isLast ? (
          <button
            type="submit"
            disabled={pending || !dueDate}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Building your plan…" : "Build my plan"}
            {!pending && <Check className="size-4" aria-hidden />}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {step === 2 && !f.momIncome ? "Skip for now" : "Continue"}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <p className="text-center text-xs text-muted">
        This planner is for organization, not medical advice. Always follow your provider&apos;s guidance.
      </p>
    </form>
  );
}

/* ---------- Small local component ---------- */

function ChoiceGroup({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 space-y-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
              value === o.value ? "border-brand bg-brand-soft/50" : "border-line hover:bg-canvas",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-1 size-4 accent-[var(--color-brand)]"
            />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

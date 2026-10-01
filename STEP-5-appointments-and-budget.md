# Step 5 — Appointments & Smart Budget (copy-paste code)

Paste each block into the file path shown. No database changes — uses `0001_init.sql` + `0002_premium.sql` only.
`src/lib/money.ts` REPLACES your current file (adds `monthlyTarget`). All other files are new.

## `src/lib/money.ts`

```ts
/* =========================================================
   Smart Budgeting — leave income plan maths.
   Pure functions: safe to use in client previews and on the server.
   ========================================================= */

export const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "CAD", "AUD", "MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type LeaveInput = {
  monthlyIncome: number | null;  // mom's normal take-home per month
  leaveWeeks: number | null;     // total weeks off
  paidWeeks: number | null;      // weeks with any pay
  payPercent: number | null;     // % of normal pay during paid weeks
};

export type LeavePlan = {
  /** Total take-home income lost during leave. */
  incomeGap: number;
  /** Weeks with no pay at all. */
  unpaidWeeks: number;
  /** Suggested amount to set aside each month until the due date. */
  monthlySavingsTarget: number | null;
};

const WEEKS_PER_MONTH = 52 / 12;

export function estimateLeavePlan(input: LeaveInput, daysUntilDue: number): LeavePlan | null {
  const { monthlyIncome, leaveWeeks } = input;
  if (!monthlyIncome || !leaveWeeks) return null;

  const paidWeeks = Math.min(input.paidWeeks ?? 0, leaveWeeks);
  const payPercent = Math.min(Math.max(input.payPercent ?? 0, 0), 100);
  const weekly = monthlyIncome / WEEKS_PER_MONTH;

  const unpaidWeeks = leaveWeeks - paidWeeks;
  const incomeGap = Math.round(weekly * (paidWeeks * (1 - payPercent / 100) + unpaidWeeks));

  const monthsLeft = daysUntilDue / 30.44;
  const monthlySavingsTarget =
    incomeGap > 0 && monthsLeft >= 1 ? Math.round(incomeGap / Math.floor(monthsLeft)) : null;

  return { incomeGap, unpaidWeeks, monthlySavingsTarget };
}

/** Monthly amount to set aside to reach `total` by the due date (null if nothing to save or < 1 month left). */
export function monthlyTarget(total: number, daysUntilDue: number): number | null {
  const months = Math.floor(daysUntilDue / 30.44);
  return total > 0 && months >= 1 ? Math.round(total / months) : null;
}
```

## `src/lib/form.ts`

```ts
/* Small, strict FormData readers shared by server actions. */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readText(fd: FormData, key: string, max: number): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s.length ? s : null;
}

/** Optional number within [min, max]. null = empty, undefined = invalid. */
export function readNumber(fd: FormData, key: string, min: number, max: number): number | null | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export function readEnum<T extends string>(fd: FormData, key: string, allowed: readonly T[]): T | undefined {
  const v = fd.get(key);
  return allowed.includes(v as T) ? (v as T) : undefined;
}
```

## `src/lib/budget.ts`

```ts
/* =========================================================
   Smart Budget — labels, starter kit and the Skip list.
   General guidance; prices vary widely, so estimates start at 0.
   ========================================================= */

export const BUDGET_CATEGORIES = [
  "medical",
  "baby_gear",
  "nursery",
  "clothing",
  "feeding",
  "leave_income",
  "other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const NEED_LEVELS = ["essential", "nice", "skip"] as const;
export type NeedLevel = (typeof NEED_LEVELS)[number];

export const SOURCES = ["buy_new", "second_hand", "borrow", "gift"] as const;
export type Source = (typeof SOURCES)[number];

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  medical: "Medical & recovery",
  baby_gear: "Baby gear",
  nursery: "Sleep & nursery",
  clothing: "Clothing",
  feeding: "Feeding",
  leave_income: "Leave & income",
  other: "Other",
};

export const NEED_LABELS: Record<NeedLevel, { title: string; hint: string }> = {
  essential: { title: "Essential", hint: "Needed in the first 3 months." },
  nice: { title: "Nice to have", hint: "Wait until after the baby shower or the first weeks." },
  skip: { title: "Skip", hint: "Not buying it — this is money you kept." },
};

export const SOURCE_LABELS: Record<Source, string> = {
  buy_new: "Buy new",
  second_hand: "Second-hand",
  borrow: "Borrow",
  gift: "Gift / registry",
};

export type BudgetItem = {
  id: string;
  label: string;
  category: BudgetCategory;
  need_level: NeedLevel;
  source: Source;
  estimated: number;
  actual: number;
  is_paid: boolean;
  buy_by_week: number | null;
};

/* ---------- Starter kit: one click to a realistic, lean list ---------- */

export type StarterItem = {
  label: string;
  category: BudgetCategory;
  need_level: Exclude<NeedLevel, "skip">;
  buy_by_week: number;
  source?: Source;
};

export const STARTER_KIT: StarterItem[] = [
  { label: "Infant car seat (buy new or with full history)", category: "baby_gear", need_level: "essential", buy_by_week: 34 },
  { label: "Crib or bassinet + firm, flat mattress", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Fitted sheets (×3)", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Sleep sacks or swaddles (×3)", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Bodysuits & sleepsuits, 0–3 months", category: "clothing", need_level: "essential", buy_by_week: 32, source: "second_hand" },
  { label: "Diapers & wipes for the first month", category: "other", need_level: "essential", buy_by_week: 36 },
  { label: "Feeding basics (nursing supplies or bottles)", category: "feeding", need_level: "essential", buy_by_week: 34 },
  { label: "Stroller or baby carrier", category: "baby_gear", need_level: "essential", buy_by_week: 34, source: "second_hand" },
  { label: "Thermometer, nail clippers, saline drops", category: "medical", need_level: "essential", buy_by_week: 36 },
  { label: "Postpartum recovery supplies", category: "medical", need_level: "essential", buy_by_week: 35 },
  { label: "Baby monitor", category: "baby_gear", need_level: "nice", buy_by_week: 36 },
  { label: "Bouncer", category: "baby_gear", need_level: "nice", buy_by_week: 38, source: "borrow" },
  { label: "Changing pad (on an existing dresser)", category: "nursery", need_level: "nice", buy_by_week: 36 },
  { label: "Nursing pillow", category: "feeding", need_level: "nice", buy_by_week: 36 },
];

/* ---------- The Skip list ---------- */

export type SkipGuideItem = {
  item: string;
  reason: string;
  /** True when it's a safety issue, not just a money one. */
  unsafe?: boolean;
};

export const SKIP_GUIDE: SkipGuideItem[] = [
  { item: "Crib bumpers, pillows & loose blankets", reason: "Not just unnecessary — safe-sleep guidance says keep the crib bare.", unsafe: true },
  { item: "Sleep positioners & inclined sleepers", reason: "Linked to safety risks. Babies should sleep flat on their back.", unsafe: true },
  { item: "Wipe warmer", reason: "Babies don't need warm wipes. One less gadget to clean." },
  { item: "Baby shoes before walking", reason: "Socks do the job until your baby walks." },
  { item: "Special baby laundry detergent", reason: "Any fragrance-free, dye-free detergent works." },
  { item: "A dedicated changing table", reason: "A changing pad on a sturdy dresser does the same job." },
  { item: "Lots of newborn-size clothes", reason: "Many babies outgrow them in weeks. Buy a few, then 0–3 months." },
  { item: "Baby food maker", reason: "Solids start months from now, and a blender or fork works." },
  { item: "Designer diaper bag", reason: "Any backpack with pockets works — and your partner will carry it too." },
  { item: "Matching nursery furniture sets", reason: "Baby needs a safe sleep space. Everything else can wait." },
];

export const SECOND_HAND_TIPS = [
  "Great second-hand: clothes, bouncers, carriers, strollers, books and toys.",
  "Check any second-hand gear against official recall lists before using it.",
  "Avoid a second-hand car seat unless you know its full history (no crashes, not expired).",
];
```

## `src/lib/appointments.ts`

```ts
export const APPOINTMENT_KINDS = ["prenatal", "ultrasound", "lab", "specialist", "class", "other"] as const;
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number];

export const KIND_LABELS: Record<AppointmentKind, string> = {
  prenatal: "Prenatal check-up",
  ultrasound: "Ultrasound / scan",
  lab: "Lab test",
  specialist: "Specialist",
  class: "Class / tour",
  other: "Other",
};

export type Appointment = {
  id: string;
  title: string;
  kind: AppointmentKind;
  scheduled_at: string;
  location: string | null;
  provider_name: string | null;
  notes: string | null;
  is_done: boolean;
};

/** One-tap presets matching the roadmap — the user only picks the date. */
export const APPOINTMENT_PRESETS: { title: string; kind: AppointmentKind; weeks: string }[] = [
  { title: "First prenatal visit", kind: "prenatal", weeks: "8–10" },
  { title: "Dating / 12-week scan", kind: "ultrasound", weeks: "11–14" },
  { title: "Anatomy scan", kind: "ultrasound", weeks: "18–22" },
  { title: "Glucose test", kind: "lab", weeks: "24–28" },
  { title: "Hospital tour", kind: "class", weeks: "28–34" },
  { title: "Group B strep test", kind: "lab", weeks: "36–38" },
];
```

## `src/app/(app)/appointments/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { APPOINTMENT_KINDS } from "@/lib/appointments";
import { UUID_RE, readEnum, readText } from "@/lib/form";
import { getSpace } from "@/lib/space";

export type AppointmentFormState = { ok: boolean; error: string | null; savedAt?: number };

const YEAR_MS = 365 * 86_400_000;

function refresh() {
  revalidatePath("/appointments");
  revalidatePath("/appointments/print");
  revalidatePath("/dashboard");
}

/** Create (no id) or update (with id) an appointment. */
export async function saveAppointment(
  _prev: AppointmentFormState,
  fd: FormData,
): Promise<AppointmentFormState> {
  const id = readText(fd, "id", 36);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "Invalid appointment." };

  const title = readText(fd, "title", 120);
  if (!title) return { ok: false, error: "Give the appointment a name." };

  const kind = readEnum(fd, "kind", APPOINTMENT_KINDS);
  if (!kind) return { ok: false, error: "Choose a type." };

  // The client converts the local date/time to an ISO timestamp before submitting.
  const raw = String(fd.get("scheduled_at") ?? "");
  const when = new Date(raw);
  if (!raw || Number.isNaN(when.getTime()) || Math.abs(when.getTime() - Date.now()) > YEAR_MS) {
    return { ok: false, error: "Pick a valid date and time." };
  }

  const values = {
    title,
    kind,
    scheduled_at: when.toISOString(),
    provider_name: readText(fd, "provider_name", 120),
    location: readText(fd, "location", 160),
    notes: readText(fd, "notes", 1000),
  };

  const { supabase, ownerId } = await getSpace();
  const { error } = id
    ? await supabase.from("appointments").update(values).eq("id", id).eq("user_id", ownerId)
    : await supabase.from("appointments").insert({ ...values, user_id: ownerId });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setAppointmentDone(id: string, done: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("appointments").update({ is_done: done }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteAppointment(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  // Questions attached to it fall back to "any visit" (ON DELETE SET NULL).
  await supabase.from("appointments").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}
```

## `src/app/(app)/appointments/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import { AddAppointment } from "@/components/appointments/add-appointment";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import type { Appointment } from "@/lib/appointments";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Appointments" };

/** Distinct, non-empty values, most recent first. */
function distinct(values: (string | null)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].slice(0, 20);
}

export default async function AppointmentsPage() {
  const { supabase, ownerId } = await getSpace();

  const [apptsRes, questionsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, title, kind, scheduled_at, location, provider_name, notes, is_done")
      .eq("user_id", ownerId)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("doctor_questions")
      .select("appointment_id")
      .eq("user_id", ownerId)
      .eq("is_asked", false),
  ]);

  const all = (apptsRes.data ?? []) as Appointment[];
  const now = Date.now();
  const graceMs = 12 * 3_600_000; // today's visit stays "upcoming" for 12h, matching the printout

  const upcoming = all.filter((a) => !a.is_done && new Date(a.scheduled_at).getTime() >= now - graceMs);
  const needsUpdate = all.filter((a) => !a.is_done && new Date(a.scheduled_at).getTime() < now - graceMs);
  const done = all.filter((a) => a.is_done).reverse();

  // Suggestions for the provider/location pickers (most recent first)
  const recentFirst = [...all].reverse();
  const providers = distinct(recentFirst.map((a) => a.provider_name));
  const locations = distinct(recentFirst.map((a) => a.location));

  // Questions not tied to a visit count toward the next one, like on the printout
  const questions = questionsRes.data ?? [];
  const unassigned = questions.filter((q) => !q.appointment_id).length;
  const openFor = (a: Appointment, isNext: boolean) =>
    questions.filter((q) => q.appointment_id === a.id).length + (isNext ? unassigned : 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Appointments</h1>
          <p className="mt-1 text-muted">Every visit in one place — shared with your Co-Pilot and ready to print.</p>
        </div>
        {upcoming.length > 0 && (
          <Link
            href="/appointments/print"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-canvas"
          >
            <Printer className="size-4" aria-hidden /> Next visit printout
          </Link>
        )}
      </header>

      <AddAppointment providers={providers} locations={locations} startOpen={all.length === 0} />

      {needsUpdate.length > 0 && (
        <section aria-labelledby="needs-update" className="space-y-3">
          <h2 id="needs-update" className="font-display text-xl">
            Needs an update
          </h2>
          {needsUpdate.map((a) => (
            <AppointmentCard key={a.id} appointment={a} providers={providers} locations={locations} variant="needs-update" />
          ))}
        </section>
      )}

      <section aria-labelledby="upcoming" className="space-y-3">
        <h2 id="upcoming" className="font-display text-xl">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Nothing booked yet. Use Quick add above — you only need to pick the date.</p>
        ) : (
          upcoming.map((a, i) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              providers={providers}
              locations={locations}
              variant={i === 0 ? "next" : "upcoming"}
              openQuestions={openFor(a, i === 0)}
            />
          ))
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="past" className="space-y-3">
          <h2 id="past" className="font-display text-xl">
            Past visits
          </h2>
          {done.map((a) => (
            <AppointmentCard key={a.id} appointment={a} providers={providers} locations={locations} variant="done" />
          ))}
        </section>
      )}
    </div>
  );
}
```

## `src/components/appointments/appointment-form.tsx`

```tsx
"use client";

import { useActionState, useId, useState } from "react";
import { saveAppointment, type AppointmentFormState } from "@/app/(app)/appointments/actions";
import {
  APPOINTMENT_KINDS,
  APPOINTMENT_PRESETS,
  KIND_LABELS,
  type Appointment,
  type AppointmentKind,
} from "@/lib/appointments";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

/** ISO timestamp → "YYYY-MM-DDTHH:mm" in the browser's timezone (for <input type="datetime-local">). */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  appointment?: Appointment;
  /** Previously used providers and locations, offered as suggestions. */
  providers: string[];
  locations: string[];
  onDone: () => void;
};

export function AppointmentForm({ appointment, providers, locations, onDone }: Props) {
  const [state, action, pending] = useActionState<AppointmentFormState, FormData>(saveAppointment, {
    ok: false,
    error: null,
  });

  // Close once a save succeeds (state changes during render — React's recommended pattern).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) onDone();
  }

  // Controlled fields so nothing is lost if the server returns an error.
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [kind, setKind] = useState<AppointmentKind>(appointment?.kind ?? "prenatal");
  const [when, setWhen] = useState(appointment ? toLocalInput(appointment.scheduled_at) : "");
  const [provider, setProvider] = useState(appointment?.provider_name ?? "");
  const [location, setLocation] = useState(appointment?.location ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");

  const listId = useId(); // unique datalist ids when several forms are open
  const parsed = when ? new Date(when) : null;
  const iso = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "";
  const isNew = !appointment;

  return (
    <form action={action} className="space-y-4">
      {appointment && <input type="hidden" name="id" value={appointment.id} />}
      <input type="hidden" name="scheduled_at" value={iso} />

      {isNew && (
        <div>
          <p className="text-sm font-medium">Quick add</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {APPOINTMENT_PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setKind(p.kind);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  title === p.title ? "border-brand bg-brand-soft text-brand-strong" : "border-line hover:bg-canvas",
                )}
              >
                {p.title} <span className="text-muted">· wk {p.weeks}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">What is it?</span>
          <input name="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 20-week check-up" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Type</span>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as AppointmentKind)} className={inputClass}>
            {APPOINTMENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Date & time</span>
          <input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Doctor / midwife</span>
          <input
            name="provider_name"
            list={`${listId}-providers`}
            maxLength={120}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Choose or type a name"
            className={inputClass}
          />
          <datalist id={`${listId}-providers`}>
            {providers.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Location</span>
          <input
            name="location"
            list={`${listId}-locations`}
            maxLength={160}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Clinic, room, address"
            className={inputClass}
          />
          <datalist id={`${listId}-locations`}>
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Fasting needed? Bring a full bladder? After the visit: what did they say?"
            className={cn(inputClass, "resize-y")}
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !iso}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : isNew ? "Add appointment" : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## `src/components/appointments/add-appointment.tsx`

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AppointmentForm } from "./appointment-form";

export function AddAppointment({ providers, locations, startOpen = false }: { providers: string[]; locations: string[]; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  // Remount the form on each open so it starts empty.
  const [formKey, setFormKey] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setFormKey((k) => k + 1);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        <Plus className="size-4" aria-hidden /> Add appointment
      </button>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 font-semibold">New appointment</h2>
      <AppointmentForm key={formKey} providers={providers} locations={locations} onDone={() => setOpen(false)} />
    </Card>
  );
}
```

## `src/components/appointments/appointment-card.tsx`

```tsx
"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Check, MapPin, Pencil, Printer, RotateCcw, Stethoscope, Trash2 } from "lucide-react";
import { deleteAppointment, setAppointmentDone } from "@/app/(app)/appointments/actions";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { KIND_LABELS, type Appointment } from "@/lib/appointments";
import { cn } from "@/lib/utils";
import { AppointmentForm } from "./appointment-form";

type Props = {
  appointment: Appointment;
  providers: string[];
  locations: string[];
  /** Upcoming visits get a printout button; past ones ask "did this happen?" */
  variant: "next" | "upcoming" | "needs-update" | "done";
  openQuestions?: number;
};

export function AppointmentCard({ appointment: a, providers, locations, variant, openQuestions = 0 }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(a.is_done);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  if (editing) {
    return (
      <Card>
        <h3 className="mb-4 font-semibold">Edit appointment</h3>
        <AppointmentForm appointment={a} providers={providers} locations={locations} onDone={() => setEditing(false)} />
      </Card>
    );
  }

  const toggleDone = () =>
    startTransition(async () => {
      setDone(!done);
      await setAppointmentDone(a.id, !done);
    });

  return (
    <Card className={cn(variant === "next" && "border-brand/40 ring-1 ring-brand/20", pending && "opacity-70")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {variant === "next" && <span className="rounded-full bg-brand px-2.5 py-0.5 text-white">Next up</span>}
            {variant === "needs-update" && (
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-brand-strong">Did this happen?</span>
            )}
            <span className="text-muted">{KIND_LABELS[a.kind]}</span>
          </div>
          <h3 className={cn("mt-1.5 text-lg font-semibold", done && "text-muted line-through")}>{a.title}</h3>
          <p className="mt-0.5 text-sm font-medium">
            <LocalDateTime iso={a.scheduled_at} />
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {a.provider_name && (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="size-4" aria-hidden /> {a.provider_name}
              </span>
            )}
            {a.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {a.location}
              </span>
            )}
          </div>
          {a.notes && <p className="mt-2 text-sm whitespace-pre-line text-ink/80">{a.notes}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          {(variant === "next" || variant === "upcoming") && (
            <Link
              href={`/appointments/print?appt=${a.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-strong hover:bg-brand/15"
            >
              <Printer className="size-4" aria-hidden /> Prepare printout
              {openQuestions > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-white">{openQuestions}</span>}
            </Link>
          )}
          <button
            type="button"
            onClick={toggleDone}
            className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-2 text-sm font-semibold hover:bg-line/60"
          >
            {done ? (
              <>
                <RotateCcw className="size-4" aria-hidden /> Not done
              </>
            ) : (
              <>
                <Check className="size-4" aria-hidden /> Mark as done
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink">
          <Pencil className="size-3.5" aria-hidden /> Edit
        </button>
        {confirmDelete ? (
          <span className="inline-flex items-center gap-1">
            <span className="px-1 text-muted">Delete this appointment?</span>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setRemoved(true);
                  await deleteAppointment(a.id);
                })
              }
              className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-strong hover:bg-brand-soft"
            >
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas">
              Keep
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-brand-strong">
            <Trash2 className="size-3.5" aria-hidden /> Delete
          </button>
        )}
      </div>
    </Card>
  );
}
```

## `src/app/(app)/budget/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { BUDGET_CATEGORIES, NEED_LEVELS, SOURCES, STARTER_KIT, type NeedLevel } from "@/lib/budget";
import { UUID_RE, readEnum, readNumber, readText } from "@/lib/form";
import { CURRENCIES } from "@/lib/money";
import { getSpace } from "@/lib/space";

export type BudgetFormState = { ok: boolean; error: string | null; savedAt?: number };

const MAX_AMOUNT = 10_000_000;

function refresh() {
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/* ---------------- Budget items ---------------- */

/** Create (no id) or update (with id) a budget item. */
export async function saveBudgetItem(_prev: BudgetFormState, fd: FormData): Promise<BudgetFormState> {
  const id = readText(fd, "id", 36);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "Invalid item." };

  const label = readText(fd, "label", 120);
  if (!label) return { ok: false, error: "What is it?" };

  const category = readEnum(fd, "category", BUDGET_CATEGORIES);
  const needLevel = readEnum(fd, "need_level", NEED_LEVELS);
  const source = readEnum(fd, "source", SOURCES);
  if (!category || !needLevel || !source) return { ok: false, error: "Please check the dropdowns." };

  const estimated = readNumber(fd, "estimated", 0, MAX_AMOUNT);
  const actual = readNumber(fd, "actual", 0, MAX_AMOUNT);
  const buyByWeek = readNumber(fd, "buy_by_week", 0, 42);
  if (estimated === undefined || actual === undefined || buyByWeek === undefined) {
    return { ok: false, error: "Please check the amounts." };
  }

  const values = {
    label,
    category,
    need_level: needLevel,
    source,
    estimated: estimated ?? 0,
    actual: actual ?? 0,
    buy_by_week: buyByWeek === null ? null : Math.round(buyByWeek),
  };

  const { supabase, ownerId } = await getSpace();
  const { error } = id
    ? await supabase.from("budget_items").update(values).eq("id", id).eq("user_id", ownerId)
    : await supabase.from("budget_items").insert({ ...values, user_id: ownerId });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setItemPaid(id: string, isPaid: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").update({ is_paid: isPaid }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function setItemNeedLevel(id: string, level: NeedLevel): Promise<void> {
  if (!UUID_RE.test(id) || !NEED_LEVELS.includes(level)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").update({ need_level: level }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteBudgetItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("budget_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Adds the lean starter kit, skipping anything already on the list (by label). */
export async function importStarterKit(): Promise<void> {
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("budget_items").select("label").eq("user_id", ownerId);
  const existing = new Set((data ?? []).map((r) => (r.label as string).toLowerCase()));

  const rows = STARTER_KIT.filter((i) => !existing.has(i.label.toLowerCase())).map((i) => ({
    user_id: ownerId,
    label: i.label,
    category: i.category,
    need_level: i.need_level,
    source: i.source ?? "buy_new",
    buy_by_week: i.buy_by_week,
    estimated: 0,
    actual: 0,
  }));

  if (rows.length) await supabase.from("budget_items").insert(rows);
  refresh();
}

/* ---------------- Leave plan (profile — owner only) ---------------- */

export async function saveLeavePlan(_prev: BudgetFormState, fd: FormData): Promise<BudgetFormState> {
  const currency = readEnum(fd, "currency", CURRENCIES);
  const momIncome = readNumber(fd, "mom_monthly_income", 0, MAX_AMOUNT);
  const partnerIncome = readNumber(fd, "partner_monthly_income", 0, MAX_AMOUNT);
  const leaveWeeks = readNumber(fd, "mom_leave_weeks", 0, 104);
  const paidWeeks = readNumber(fd, "mom_paid_weeks", 0, 104);
  const payPercent = readNumber(fd, "mom_leave_pay_percent", 0, 100);
  const partnerLeave = readNumber(fd, "partner_leave_weeks", 0, 104);

  if (!currency) return { ok: false, error: "Choose a currency." };
  if ([momIncome, partnerIncome, leaveWeeks, paidWeeks, payPercent, partnerLeave].includes(undefined)) {
    return { ok: false, error: "Some values are out of range." };
  }
  if (leaveWeeks != null && paidWeeks != null && paidWeeks > leaveWeeks) {
    return { ok: false, error: "Paid weeks can't be more than total leave weeks." };
  }

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return { ok: false, error: "Only the plan owner can change the leave plan." };

  const round = (n: number | null | undefined) => (n == null ? null : Math.round(n));
  const { error } = await supabase
    .from("profiles")
    .update({
      currency,
      mom_monthly_income: momIncome,
      partner_monthly_income: partnerIncome,
      mom_leave_weeks: round(leaveWeeks),
      mom_paid_weeks: round(paidWeeks),
      mom_leave_pay_percent: round(payPercent),
      partner_leave_weeks: round(partnerLeave),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true, error: null, savedAt: Date.now() };
}
```

## `src/app/(app)/budget/page.tsx`

```tsx
import type { Metadata } from "next";
import { PiggyBank, Sparkles } from "lucide-react";
import { AddBudgetItem } from "@/components/budget/add-budget-item";
import { BudgetItemRow } from "@/components/budget/budget-item-row";
import { LeavePlanForm } from "@/components/budget/leave-plan-form";
import { SkipGuide } from "@/components/budget/skip-guide";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NEED_LABELS, STARTER_KIT, type BudgetItem, type NeedLevel } from "@/lib/budget";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { formatMoney } from "@/lib/utils";
import { importStarterKit } from "./actions";

export const metadata: Metadata = { title: "Smart budget" };

const str = (v: number | null | undefined) => (v == null ? "" : String(v));

export default async function BudgetPage() {
  const { supabase, ownerId, role, profile } = await getSpace();
  const currency = profile?.currency ?? "USD";
  const money = (v: number) => formatMoney(v, currency);

  const { data } = await supabase
    .from("budget_items")
    .select("id, label, category, need_level, source, estimated, actual, is_paid, buy_by_week")
    .eq("user_id", ownerId)
    .order("buy_by_week", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  // numeric columns arrive as strings from PostgREST — normalise once here
  const items: BudgetItem[] = (data ?? []).map((r) => ({
    ...(r as BudgetItem),
    estimated: Number(r.estimated),
    actual: Number(r.actual),
  }));

  const byNeed = (n: NeedLevel) => items.filter((i) => i.need_level === n);
  const essentials = byNeed("essential");
  const nice = byNeed("nice");
  const skipped = byNeed("skip");

  const cost = (i: BudgetItem) => i.actual || i.estimated;
  const essentialsPlanned = essentials.reduce((s, i) => s + cost(i), 0);
  const essentialsRemaining = essentials.filter((i) => !i.is_paid).reduce((s, i) => s + i.estimated, 0);
  const essentialsBought = essentials.filter((i) => i.is_paid).length;
  const niceTotal = nice.reduce((s, i) => s + cost(i), 0);
  const kept = skipped.reduce((s, i) => s + i.estimated, 0);
  const secondHandCount = items.filter((i) => i.source !== "buy_new" && i.need_level !== "skip").length;

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;

  const sections: { need: NeedLevel; rows: BudgetItem[]; add: string }[] = [
    { need: "essential", rows: essentials, add: "Add essential" },
    { need: "nice", rows: nice, add: "Add nice-to-have" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Smart budget</h1>
        <p className="mt-1 text-muted">
          Plan the leave, buy only what matters, and see exactly what to set aside each month.
        </p>
      </header>

      {/* ---------- Leave plan ---------- */}
      <section id="leave-plan" aria-labelledby="leave-title" className="scroll-mt-24">
        <Card>
          <div className="mb-5 flex items-center gap-2.5">
            <PiggyBank className="size-5 text-brand" aria-hidden />
            <h2 id="leave-title" className="font-display text-2xl">
              Maternity leave plan
            </h2>
          </div>
          <LeavePlanForm
            readOnly={role !== "owner"}
            daysToGo={status?.daysToGo ?? 0}
            essentialsRemaining={essentialsRemaining}
            defaults={{
              currency,
              momIncome: str(profile?.mom_monthly_income),
              partnerIncome: str(profile?.partner_monthly_income),
              leaveWeeks: str(profile?.mom_leave_weeks),
              paidWeeks: str(profile?.mom_paid_weeks),
              payPercent: str(profile?.mom_leave_pay_percent),
              partnerLeaveWeeks: str(profile?.partner_leave_weeks),
            }}
          />
        </Card>
      </section>

      {/* ---------- Summary ---------- */}
      <section aria-label="Budget summary" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Essentials</p>
          <p className="mt-1 font-display text-2xl">{money(essentialsPlanned)}</p>
          <ProgressBar
            value={essentials.length ? (essentialsBought / essentials.length) * 100 : 0}
            label="Essentials bought"
            tone="sage"
            className="mt-3"
          />
          <p className="mt-1.5 text-xs text-muted">
            {essentialsBought} of {essentials.length} bought
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Nice to have</p>
          <p className="mt-1 font-display text-2xl">{money(niceTotal)}</p>
          <p className="mt-3 text-xs text-muted">Wait until after gifts arrive — many of these turn up for free.</p>
        </Card>
        <Card className="bg-sage-soft/70">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Money kept</p>
          <p className="mt-1 font-display text-2xl text-sage">{money(kept)}</p>
          <p className="mt-3 text-xs text-muted">
            From {skipped.length} skipped item{skipped.length === 1 ? "" : "s"}
            {secondHandCount > 0 && ` · ${secondHandCount} second-hand, borrowed or gifted`}
          </p>
        </Card>
      </section>

      {/* ---------- Starter kit ---------- */}
      {items.length === 0 && (
        <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">Start with our lean list</p>
              <p className="text-sm text-muted">
                {STARTER_KIT.length} items that actually matter in the first 3 months. Just add your prices.
              </p>
            </div>
          </div>
          <form action={importStarterKit}>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Add the starter list
            </button>
          </form>
        </Card>
      )}

      {/* ---------- Essential / Nice ---------- */}
      {sections.map(({ need, rows, add }) => (
        <section key={need} aria-labelledby={`${need}-title`}>
          <Card>
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`${need}-title`} className="font-display text-2xl">
                {NEED_LABELS[need].title}
              </h2>
              <p className="text-sm text-muted">{NEED_LABELS[need].hint}</p>
            </div>
            {rows.length > 0 ? (
              <ul className="mt-2 divide-y divide-line">
                {rows.map((i) => (
                  <BudgetItemRow key={i.id} item={i} currency={currency} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted">Nothing here yet.</p>
            )}
            <div className="mt-2 border-t border-line pt-3">
              <AddBudgetItem need={need} currency={currency} label={add} />
            </div>
          </Card>
        </section>
      ))}

      {/* ---------- Skip list ---------- */}
      <section id="skip-list" aria-labelledby="skip-title" className="scroll-mt-24">
        <Card>
          <h2 id="skip-title" className="font-display text-2xl">
            The Skip list
          </h2>
          <p className="mt-1 text-sm text-muted">
            Things most families buy and barely use — plus a few that aren&apos;t safe for sleep.
          </p>
          <div className="mt-5">
            <SkipGuide />
          </div>

          <h3 className="mt-8 font-semibold">Your skipped items</h3>
          <p className="text-sm text-muted">Add anything you decided not to buy, with its price — watch the money you keep grow.</p>
          {skipped.length > 0 && (
            <ul className="mt-2 divide-y divide-line">
              {skipped.map((i) => (
                <BudgetItemRow key={i.id} item={i} currency={currency} />
              ))}
            </ul>
          )}
          <div className="mt-2 border-t border-line pt-3">
            <AddBudgetItem need="skip" currency={currency} label="Add skipped item" />
          </div>
        </Card>
      </section>
    </div>
  );
}
```

## `src/components/budget/leave-plan-form.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { saveLeavePlan, type BudgetFormState } from "@/app/(app)/budget/actions";
import { CURRENCIES, estimateLeavePlan, monthlyTarget } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

export type LeaveDefaults = {
  currency: string;
  momIncome: string;
  partnerIncome: string;
  leaveWeeks: string;
  paidWeeks: string;
  payPercent: string;
  partnerLeaveWeeks: string;
};

type Props = {
  defaults: LeaveDefaults;
  daysToGo: number;
  /** Essentials not yet paid for — added to the "save per month" figure. */
  essentialsRemaining: number;
  readOnly: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand disabled:bg-canvas disabled:text-muted";

function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={strong ? "rounded-xl bg-brand-soft/70 p-4" : "rounded-xl bg-canvas p-4"}>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function LeavePlanForm({ defaults, daysToGo, essentialsRemaining, readOnly }: Props) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(saveLeavePlan, { ok: false, error: null });
  const [f, setF] = useState(defaults);
  const set = (k: keyof LeaveDefaults) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const plan = estimateLeavePlan(
    { monthlyIncome: n(f.momIncome), leaveWeeks: n(f.leaveWeeks), paidWeeks: n(f.paidWeeks), payPercent: n(f.payPercent) },
    daysToGo,
  );
  const gap = plan?.incomeGap ?? 0;
  const totalToSave = gap + essentialsRemaining;
  const perMonth = monthlyTarget(totalToSave, daysToGo);
  const money = (v: number) => formatMoney(v, f.currency);

  const fields: { key: keyof LeaveDefaults; name: string; label: string; max?: number; mode: "decimal" | "numeric" }[] = [
    { key: "momIncome", name: "mom_monthly_income", label: "Your monthly take-home", mode: "decimal" },
    { key: "partnerIncome", name: "partner_monthly_income", label: "Partner's monthly take-home", mode: "decimal" },
    { key: "leaveWeeks", name: "mom_leave_weeks", label: "Your total leave (weeks)", max: 104, mode: "numeric" },
    { key: "paidWeeks", name: "mom_paid_weeks", label: "Of which paid (weeks)", max: 104, mode: "numeric" },
    { key: "payPercent", name: "mom_leave_pay_percent", label: "Pay during paid leave (%)", max: 100, mode: "numeric" },
    { key: "partnerLeaveWeeks", name: "partner_leave_weeks", label: "Partner's leave (weeks)", max: 104, mode: "numeric" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <form action={action} className="space-y-4">
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Currency</span>
            <select name="currency" value={f.currency} onChange={set("currency")} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {fields.map((fl) => (
            <label key={fl.key} className="block">
              <span className="text-sm font-medium">{fl.label}</span>
              <input
                name={fl.name}
                type="number"
                min={0}
                max={fl.max}
                step="any"
                inputMode={fl.mode}
                value={f[fl.key]}
                onChange={set(fl.key)}
                className={inputClass}
              />
            </label>
          ))}
        </fieldset>

        {readOnly ? (
          <p className="text-sm text-muted">Only the plan owner can edit these numbers.</p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save leave plan"}
            </button>
            {state.ok && !pending && (
              <span className="inline-flex items-center gap-1 text-sm text-sage">
                <Check className="size-4" aria-hidden /> Saved
              </span>
            )}
            {state.error && (
              <span role="alert" className="text-sm text-brand-strong">
                {state.error}
              </span>
            )}
          </div>
        )}
      </form>

      <div aria-live="polite" className="space-y-3">
        {plan ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Leave income gap"
                value={money(gap)}
                hint={plan.unpaidWeeks ? `Includes ${plan.unpaidWeeks} unpaid weeks` : "All leave weeks are paid"}
              />
              <Stat label="Essentials still to buy" value={money(essentialsRemaining)} hint="From your Essential list" />
            </div>
            <Stat
              strong
              label="Your monthly savings target"
              value={perMonth ? `${money(perMonth)} / month` : totalToSave > 0 ? "Due date is close" : "You're covered 🎉"}
              hint={
                perMonth
                  ? `Sets aside ${money(totalToSave)} before your due date — so leave is about the baby, not the bills.`
                  : totalToSave > 0
                    ? "Focus on trimming the Nice-to-have list and using gifts or second-hand."
                    : undefined
              }
            />
          </>
        ) : (
          <div className="rounded-xl bg-canvas p-4 text-sm text-muted">
            Add your take-home pay and leave weeks to see your income gap and a calm monthly savings target.
          </div>
        )}
      </div>
    </div>
  );
}
```

## `src/components/budget/budget-item-form.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { saveBudgetItem, type BudgetFormState } from "@/app/(app)/budget/actions";
import {
  BUDGET_CATEGORIES,
  CATEGORY_LABELS,
  NEED_LABELS,
  NEED_LEVELS,
  SOURCES,
  SOURCE_LABELS,
  type BudgetItem,
  type NeedLevel,
} from "@/lib/budget";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

type Props = { item?: BudgetItem; defaultNeed?: NeedLevel; currency: string; onDone: () => void };

export function BudgetItemForm({ item, defaultNeed = "essential", currency, onDone }: Props) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(saveBudgetItem, { ok: false, error: null });

  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) onDone();
  }

  const [f, setF] = useState({
    label: item?.label ?? "",
    category: item?.category ?? "baby_gear",
    need_level: item?.need_level ?? defaultNeed,
    source: item?.source ?? "buy_new",
    estimated: item?.estimated ? String(item.estimated) : "",
    actual: item?.actual ? String(item.actual) : "",
    buy_by_week: item?.buy_by_week != null ? String(item.buy_by_week) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Item</span>
          <input name="label" required maxLength={120} value={f.label} onChange={set("label")} placeholder="e.g. Stroller" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Do we need it?</span>
          <select name="need_level" value={f.need_level} onChange={set("need_level")} className={inputClass}>
            {NEED_LEVELS.map((n) => (
              <option key={n} value={n}>
                {NEED_LABELS[n].title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <select name="category" value={f.category} onChange={set("category")} className={inputClass}>
            {BUDGET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">How we&apos;ll get it</span>
          <select name="source" value={f.source} onChange={set("source")} className={inputClass}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Get it by week</span>
          <input name="buy_by_week" type="number" min={0} max={42} inputMode="numeric" value={f.buy_by_week} onChange={set("buy_by_week")} placeholder="e.g. 34" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            {f.need_level === "skip" ? "Price you'd have paid" : "Estimated cost"} ({currency})
          </span>
          <input name="estimated" type="number" min={0} step="any" inputMode="decimal" value={f.estimated} onChange={set("estimated")} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Actually spent ({currency})</span>
          <input name="actual" type="number" min={0} step="any" inputMode="decimal" value={f.actual} onChange={set("actual")} className={inputClass} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## `src/components/budget/add-budget-item.tsx`

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { NeedLevel } from "@/lib/budget";
import { BudgetItemForm } from "./budget-item-form";

export function AddBudgetItem({ need, currency, label }: { need: NeedLevel; currency: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
      >
        <Plus className="size-4" aria-hidden /> {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <BudgetItemForm key={key} defaultNeed={need} currency={currency} onDone={() => setOpen(false)} />
    </div>
  );
}
```

## `src/components/budget/budget-item-row.tsx`

```tsx
"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { deleteBudgetItem, setItemNeedLevel, setItemPaid } from "@/app/(app)/budget/actions";
import {
  CATEGORY_LABELS,
  NEED_LABELS,
  NEED_LEVELS,
  SOURCE_LABELS,
  type BudgetItem,
  type NeedLevel,
} from "@/lib/budget";
import { cn, formatMoney } from "@/lib/utils";
import { BudgetItemForm } from "./budget-item-form";

export function BudgetItemRow({ item, currency }: { item: BudgetItem; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useOptimistic(item.is_paid);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  if (editing) {
    return (
      <li className="py-4">
        <BudgetItemForm item={item} currency={currency} onDone={() => setEditing(false)} />
      </li>
    );
  }

  const money = (v: number) => formatMoney(v, currency);
  const isSkip = item.need_level === "skip";

  return (
    <li className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center", pending && "opacity-70")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {!isSkip && (
          <button
            type="button"
            role="checkbox"
            aria-checked={paid}
            aria-label={`Mark ${item.label} as ${paid ? "not bought" : "bought"}`}
            onClick={() =>
              startTransition(async () => {
                setPaid(!paid);
                await setItemPaid(item.id, !paid);
              })
            }
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
              paid ? "border-sage bg-sage text-white" : "border-line hover:border-sage",
            )}
          >
            {paid && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
          </button>
        )}
        <div className="min-w-0">
          <p className={cn("font-medium", paid && "text-muted line-through")}>{item.label}</p>
          <p className="mt-0.5 text-xs text-muted">
            {CATEGORY_LABELS[item.category]} · {SOURCE_LABELS[item.source]}
            {item.buy_by_week != null && !isSkip && ` · by week ${item.buy_by_week}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-right text-sm">
          {isSkip ? (
            <span className="font-semibold text-sage">{item.estimated ? `Kept ${money(item.estimated)}` : "Kept"}</span>
          ) : (
            <>
              <span className="font-semibold">{money(item.actual || item.estimated)}</span>
              <span className="block text-xs text-muted">
                {item.actual ? `planned ${money(item.estimated)}` : item.estimated ? "estimate" : "add a price"}
              </span>
            </>
          )}
        </p>

        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`need-${item.id}`}>
            Need level
          </label>
          <select
            id={`need-${item.id}`}
            value={item.need_level}
            onChange={(e) =>
              startTransition(async () => {
                await setItemNeedLevel(item.id, e.target.value as NeedLevel);
              })
            }
            className="rounded-lg border border-line bg-surface py-1.5 pr-7 pl-2 text-xs font-semibold"
          >
            {NEED_LEVELS.map((n) => (
              <option key={n} value={n}>
                {NEED_LABELS[n].title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${item.label}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink">
            <Pencil className="size-4" />
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setRemoved(true);
                  await deleteBudgetItem(item.id);
                })
              }
              onBlur={() => setConfirmDelete(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"
            >
              Delete?
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${item.label}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
```

## `src/components/budget/skip-guide.tsx`

```tsx
import { ShieldAlert } from "lucide-react";
import { SECOND_HAND_TIPS, SKIP_GUIDE } from "@/lib/budget";

export function SkipGuide() {
  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {SKIP_GUIDE.map((g) => (
          <li
            key={g.item}
            className={g.unsafe ? "rounded-xl border border-brand/30 bg-brand-soft/50 p-4" : "rounded-xl bg-canvas p-4"}
          >
            <p className="flex items-center gap-1.5 font-medium">
              {g.unsafe && <ShieldAlert className="size-4 shrink-0 text-brand-strong" aria-label="Safety" />}
              {g.item}
            </p>
            <p className="mt-1 text-sm text-muted">{g.reason}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-sage-soft p-4">
        <p className="text-sm font-semibold">Buying second-hand, safely</p>
        <ul className="mt-2 space-y-1 text-sm">
          {SECOND_HAND_TIPS.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```


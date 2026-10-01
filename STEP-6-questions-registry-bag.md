# Step 6 — Doctor Questions, Registry & Hospital Bag (copy-paste code)

No database changes. New files: the first 20 blocks. **Replaced** files (small fixes): `budget/actions.ts` (0-row check on Save leave plan), `appointments/print/actions.ts` (also refreshes /questions), `onboarding/actions.ts` (the 0-row check from our debugging session).

## `src/lib/question-ideas.ts`

```ts
import type { Trimester } from "@/lib/pregnancy";

/** One-tap question ideas for each trimester — added to the user's list on click. */
export const QUESTION_IDEAS: Record<Trimester, string[]> = {
  1: [
    "Which prenatal vitamin and dose is right for me?",
    "Are all my current medications and supplements safe?",
    "Which screening tests do you recommend, and when?",
    "Which symptoms mean I should call you right away?",
    "Can I keep doing my current exercise routine?",
  ],
  2: [
    "What will the anatomy scan check?",
    "When is the glucose test, and do I need to fast?",
    "Which vaccines do you recommend during pregnancy, and when?",
    "Is it safe to travel, and until which week?",
    "How will I know if the baby's movements are normal?",
  ],
  3: [
    "When exactly should we call or come in once labor starts?",
    "What pain relief options are available where I'm giving birth?",
    "What happens if I go past my due date?",
    "When will you test for Group B strep?",
    "Can we go over my birth preferences together?",
  ],
};

export const ALL_QUESTION_IDEAS = new Set(Object.values(QUESTION_IDEAS).flat());
```

## `src/lib/registry.ts`

```ts
export const REGISTRY_PRIORITIES = ["must", "nice", "later"] as const;
export type RegistryPriority = (typeof REGISTRY_PRIORITIES)[number];

export const REGISTRY_STATUSES = ["wanted", "purchased", "received"] as const;
export type RegistryStatus = (typeof REGISTRY_STATUSES)[number];

export const PRIORITY_LABELS: Record<RegistryPriority, { title: string; hint: string }> = {
  must: { title: "Must-haves", hint: "Needed before baby arrives." },
  nice: { title: "Nice to have", hint: "Great gift ideas." },
  later: { title: "For later", hint: "Needed after 3 months — no rush." },
};

export const STATUS_LABELS: Record<RegistryStatus, string> = {
  wanted: "Still needed",
  purchased: "Bought",
  received: "Received",
};

export const REGISTRY_CATEGORY_SUGGESTIONS = ["Travel", "Sleep", "Feeding", "Clothing", "Bath & care", "Play", "For mom"];

export type RegistryItem = {
  id: string;
  name: string;
  category: string | null;
  priority: RegistryPriority;
  url: string | null;
  price: number | null;
  status: RegistryStatus;
};

/** Accepts only http(s) links; returns null otherwise. */
export function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.startsWith("http") ? value : `https://${value}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
```

## `src/lib/hospital-bag.ts`

```ts
export const BAGS = ["mom", "baby", "partner"] as const;
export type Bag = (typeof BAGS)[number];

export type BagItem = {
  id: string;
  bag: Bag;
  label: string;
  is_packed: boolean;
  sort_order: number;
};

/** Mirrors the list seeded by the signup trigger in 0001_init.sql. */
export const DEFAULT_BAG: Record<Bag, string[]> = {
  mom: [
    "Photo ID, insurance card & hospital papers",
    "Birth plan (2 copies)",
    "Phone + long charging cable",
    "Comfortable robe & slippers",
    "Nursing bras & breast pads",
    "Maternity pads & high-waist underwear",
    "Toiletries, lip balm, hair ties",
    "Loose going-home outfit",
  ],
  baby: [
    "Installed car seat",
    "2–3 bodysuits & sleepsuits",
    "Hat, socks & mittens",
    "Swaddle / receiving blanket",
    "Newborn diapers & wipes",
    "Going-home outfit",
  ],
  partner: ["Snacks & water bottle", "Change of clothes", "Phone charger / power bank", "Pillow & blanket"],
};

export const PACK_BY_WEEK = 36;
```

## `src/app/(app)/questions/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { UUID_RE, readText } from "@/lib/form";
import { ALL_QUESTION_IDEAS } from "@/lib/question-ideas";
import { getSpace } from "@/lib/space";

export type QuestionFormState = { ok: boolean; error: string | null; savedAt?: number };

function refresh() {
  revalidatePath("/questions");
  revalidatePath("/appointments");
  revalidatePath("/appointments/print");
  revalidatePath("/dashboard");
}

/** Returns the appointment id only if it belongs to the current space. */
async function ownAppointment(id: string | null): Promise<string | null | false> {
  if (!id) return null;
  if (!UUID_RE.test(id)) return false;
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("appointments").select("id").eq("id", id).eq("user_id", ownerId).maybeSingle();
  return data ? id : false;
}

export async function addQuestion(_prev: QuestionFormState, fd: FormData): Promise<QuestionFormState> {
  const question = readText(fd, "question", 300);
  if (!question) return { ok: false, error: "Type your question first." };

  const appointmentId = await ownAppointment(readText(fd, "appointment_id", 36));
  if (appointmentId === false) return { ok: false, error: "That appointment wasn't found." };

  const { supabase, ownerId } = await getSpace();
  const { error } = await supabase.from("doctor_questions").insert({
    user_id: ownerId,
    question,
    is_priority: fd.get("is_priority") === "on",
    appointment_id: appointmentId,
  });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

/** One-tap add from the suggested ideas (only accepts known ideas). */
export async function addSuggestedQuestion(question: string): Promise<void> {
  if (!ALL_QUESTION_IDEAS.has(question)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").insert({ user_id: ownerId, question });
  refresh();
}

export async function setQuestionPriority(id: string, isPriority: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").update({ is_priority: isPriority }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function assignQuestion(id: string, appointmentId: string | null): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const appt = await ownAppointment(appointmentId);
  if (appt === false) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").update({ appointment_id: appt }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Marks a question as asked, optionally saving what the doctor said. */
export async function answerQuestion(id: string, answer: string | null): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const clean = answer?.trim().slice(0, 2000) || null;
  const { supabase, ownerId } = await getSpace();
  await supabase
    .from("doctor_questions")
    .update({ is_asked: true, answer: clean })
    .eq("id", id)
    .eq("user_id", ownerId);
  refresh();
}

export async function reopenQuestion(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").update({ is_asked: false }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}
```

## `src/app/(app)/questions/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb, Printer } from "lucide-react";
import { AnsweredQuestion } from "@/components/questions/answered-question";
import { OpenQuestion } from "@/components/questions/open-question";
import { QuestionAddForm } from "@/components/questions/question-add-form";
import { QuestionIdeas } from "@/components/questions/question-ideas";
import type { AppointmentOption, QuestionRecord } from "@/components/questions/types";
import { Card } from "@/components/ui/card";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { QUESTION_IDEAS } from "@/lib/question-ideas";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Doctor questions" };

export default async function QuestionsPage() {
  const { supabase, ownerId, profile } = await getSpace();
  const since = new Date(Date.now() - 12 * 3_600_000).toISOString(); // same "upcoming" window as the printout

  const [questionsRes, apptsRes, membersRes] = await Promise.all([
    supabase
      .from("doctor_questions")
      .select("id, question, answer, is_asked, is_priority, appointment_id, created_by")
      .eq("user_id", ownerId)
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, title, scheduled_at")
      .eq("user_id", ownerId)
      .eq("is_done", false)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: true }),
    supabase.from("pregnancy_members").select("member_id").eq("owner_id", ownerId),
  ]);

  const questions = (questionsRes.data ?? []) as QuestionRecord[];
  const appointments = (apptsRes.data ?? []) as AppointmentOption[];
  const partnerIds = new Set((membersRes.data ?? []).map((m) => m.member_id as string));

  const open = questions.filter((q) => !q.is_asked);
  const answered = questions.filter((q) => q.is_asked).reverse();

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const existing = new Set(questions.map((q) => q.question));
  const ideas = status ? QUESTION_IDEAS[status.trimester].filter((i) => !existing.has(i)) : [];

  const addedBy = (q: QuestionRecord) =>
    q.created_by && partnerIds.has(q.created_by) ? profile?.partner_name || "your partner" : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Doctor questions</h1>
          <p className="mt-1 text-muted">
            Capture questions anytime — you and your Co-Pilot. Star the must-asks; they go to the top of your printout.
          </p>
        </div>
        <Link
          href="/appointments/print"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-canvas"
        >
          <Printer className="size-4" aria-hidden /> Visit printout
        </Link>
      </header>

      <Card>
        <QuestionAddForm appointments={appointments} />
      </Card>

      {ideas.length > 0 && status && (
        <Card className="bg-canvas">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-brand" aria-hidden /> Common questions in trimester {status.trimester}
          </p>
          <QuestionIdeas ideas={ideas} />
        </Card>
      )}

      <Card>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">To ask</h2>
          <p className="text-sm text-muted">
            {open.length} open · {open.filter((q) => q.is_priority).length} must-ask
          </p>
        </div>
        {open.length > 0 ? (
          <ul className="divide-y divide-line">
            {open.map((q) => (
              <OpenQuestion key={q.id} q={q} appointments={appointments} addedBy={addedBy(q)} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted">No open questions. Add one above or tap an idea.</p>
        )}
      </Card>

      {answered.length > 0 && (
        <Card>
          <h2 className="font-display text-2xl">Answers from past visits</h2>
          <p className="mt-1 text-sm text-muted">Your personal record of what the doctor said.</p>
          <ul className="divide-y divide-line">
            {answered.map((q) => (
              <AnsweredQuestion key={q.id} q={q} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

## `src/components/questions/types.ts`

```ts
export type QuestionRecord = {
  id: string;
  question: string;
  answer: string | null;
  is_asked: boolean;
  is_priority: boolean;
  appointment_id: string | null;
  created_by: string | null;
};

/** Upcoming appointments offered in the "For" picker. */
export type AppointmentOption = { id: string; title: string; scheduled_at: string };
```

## `src/components/questions/appointment-select.tsx`

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/utils";
import type { AppointmentOption } from "./types";

type Props = {
  appointments: AppointmentOption[];
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

const subscribe = () => () => {};

/** "Next visit (any)" + upcoming appointments, with dates in the viewer's timezone. */
export function AppointmentSelect({ appointments, name, value, onChange, className }: Props) {
  // Server render shows titles only; the browser adds local dates after hydration (no mismatch).
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <select
      name={name}
      value={value}
      defaultValue={value === undefined ? "" : undefined}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        className ??
        "max-w-[16rem] rounded-lg border border-line bg-surface py-1.5 pr-7 pl-2 text-sm outline-none focus:border-brand"
      }
    >
      <option value="">Next visit (any)</option>
      {appointments.map((a) => (
        <option key={a.id} value={a.id}>
          {isClient ? `${a.title} · ${formatDateTime(a.scheduled_at)}` : a.title}
        </option>
      ))}
    </select>
  );
}
```

## `src/components/questions/question-add-form.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addQuestion, type QuestionFormState } from "@/app/(app)/questions/actions";
import { AppointmentSelect } from "./appointment-select";
import type { AppointmentOption } from "./types";

export function QuestionAddForm({ appointments }: { appointments: AppointmentOption[] }) {
  const [state, action, pending] = useActionState<QuestionFormState, FormData>(addQuestion, { ok: false, error: null });

  // Uncontrolled on purpose: React 19 clears the form after each submit, ready for the next question.
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">New question</span>
        <textarea
          name="question"
          required
          maxLength={300}
          rows={2}
          placeholder="Write it down the moment you think of it…"
          className="mt-1 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="is_priority" className="size-4 accent-[var(--color-brand)]" />
            Must ask
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">For</span>
            <AppointmentSelect name="appointment_id" appointments={appointments} />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden /> {pending ? "Adding…" : "Add question"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}
    </form>
  );
}
```

## `src/components/questions/question-ideas.tsx`

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { Plus } from "lucide-react";
import { addSuggestedQuestion } from "@/app/(app)/questions/actions";

export function QuestionIdeas({ ideas }: { ideas: string[] }) {
  const [, startTransition] = useTransition();
  const [added, markAdded] = useOptimistic<string[], string>([], (prev, q) => [...prev, q]);
  const visible = ideas.filter((i) => !added.includes(i));

  if (visible.length === 0) return <p className="text-sm text-muted">All ideas for this trimester are on your list.</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {visible.map((idea) => (
        <li key={idea}>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                markAdded(idea);
                await addSuggestedQuestion(idea);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-left text-sm hover:border-brand hover:bg-brand-soft/40"
          >
            <Plus className="size-3.5 shrink-0 text-brand" aria-hidden /> {idea}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## `src/components/questions/open-question.tsx`

```tsx
"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, MessageSquareText, Star, Trash2 } from "lucide-react";
import {
  answerQuestion,
  assignQuestion,
  deleteQuestion,
  setQuestionPriority,
} from "@/app/(app)/questions/actions";
import { cn } from "@/lib/utils";
import { AppointmentSelect } from "./appointment-select";
import type { AppointmentOption, QuestionRecord } from "./types";

type Props = { q: QuestionRecord; appointments: AppointmentOption[]; addedBy?: string };

export function OpenQuestion({ q, appointments, addedBy }: Props) {
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useOptimistic(q.is_priority);
  const [gone, setGone] = useOptimistic(false);
  const [answering, setAnswering] = useState(false);
  const [answer, setAnswer] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (gone) return null;

  const finish = (text: string | null) =>
    startTransition(async () => {
      setGone(true);
      await answerQuestion(q.id, text);
    });

  // Appointments may have been completed since the question was linked — keep the current value selectable.
  const linkedMissing = q.appointment_id && !appointments.some((a) => a.id === q.appointment_id);

  return (
    <li className={cn("py-4", pending && "opacity-70")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-pressed={priority}
          aria-label={priority ? "Remove from must-ask" : "Mark as must-ask"}
          onClick={() =>
            startTransition(async () => {
              setPriority(!priority);
              await setQuestionPriority(q.id, !priority);
            })
          }
          className="mt-0.5 shrink-0 rounded-md p-0.5 hover:bg-canvas"
        >
          <Star className={cn("size-5", priority ? "fill-brand text-brand" : "text-line")} />
        </button>

        <div className="min-w-0 flex-1">
          <p className={cn(priority && "font-semibold")}>{q.question}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>For</span>
            {linkedMissing ? (
              <span className="rounded-lg bg-canvas px-2 py-1">A past visit</span>
            ) : (
              <AppointmentSelect
                appointments={appointments}
                value={q.appointment_id ?? ""}
                onChange={(v) => startTransition(async () => assignQuestion(q.id, v || null))}
                className="max-w-[19rem] rounded-lg border border-line bg-surface py-1 pr-7 pl-2 text-xs"
              />
            )}
            {addedBy && <span>· Added by {addedBy}</span>}
          </div>

          {answering ? (
            <div className="mt-3 space-y-2">
              <label className="block">
                <span className="text-sm font-medium">What did they say?</span>
                <textarea
                  autoFocus
                  rows={2}
                  maxLength={2000}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="mt-1 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-base outline-none focus:border-brand"
                />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => finish(answer)} className="rounded-lg bg-sage px-3 py-1.5 text-sm font-semibold text-white hover:bg-sage/90">
                  Save answer
                </button>
                <button type="button" onClick={() => setAnswering(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
              <button type="button" onClick={() => setAnswering(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 font-semibold hover:bg-line/60">
                <MessageSquareText className="size-4" aria-hidden /> Add answer
              </button>
              <button type="button" onClick={() => finish(null)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink">
                <Check className="size-4" aria-hidden /> Asked
              </button>
              {confirmDelete ? (
                <button
                  type="button"
                  onBlur={() => setConfirmDelete(false)}
                  onClick={() =>
                    startTransition(async () => {
                      setGone(true);
                      await deleteQuestion(q.id);
                    })
                  }
                  className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-strong hover:bg-brand-soft"
                >
                  Delete?
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete question" className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
```

## `src/components/questions/answered-question.tsx`

```tsx
"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { answerQuestion, reopenQuestion } from "@/app/(app)/questions/actions";
import type { QuestionRecord } from "./types";

export function AnsweredQuestion({ q }: { q: QuestionRecord }) {
  const [, startTransition] = useTransition();
  const [gone, setGone] = useOptimistic(false);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(q.answer ?? "");

  if (gone) return null;

  return (
    <li className="py-4">
      <p className="font-medium">{q.question}</p>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            autoFocus
            rows={2}
            maxLength={2000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            aria-label="Answer"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-base outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                startTransition(async () => answerQuestion(q.id, answer));
              }}
              className="rounded-lg bg-sage px-3 py-1.5 text-sm font-semibold text-white hover:bg-sage/90"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={q.answer ? "mt-1.5 rounded-xl bg-sage-soft/70 px-3 py-2 text-sm whitespace-pre-line" : "mt-1 text-sm text-muted italic"}>
          {q.answer || "Asked — no answer noted."}
        </p>
      )}
      {!editing && (
        <div className="mt-2 flex gap-1 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink">
            <Pencil className="size-3.5" aria-hidden /> {q.answer ? "Edit answer" : "Add answer"}
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                setGone(true);
                await reopenQuestion(q.id);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-canvas hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Ask again
          </button>
        </div>
      )}
    </li>
  );
}
```

## `src/app/(app)/registry/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { STARTER_KIT } from "@/lib/budget";
import { UUID_RE, readEnum, readNumber, readText } from "@/lib/form";
import { REGISTRY_PRIORITIES, REGISTRY_STATUSES, safeUrl, type RegistryStatus } from "@/lib/registry";
import { getSpace } from "@/lib/space";

export type RegistryFormState = { ok: boolean; error: string | null; savedAt?: number };

function refresh() {
  revalidatePath("/registry");
  revalidatePath("/dashboard");
}

/** Create (no id) or update (with id) a registry item. */
export async function saveRegistryItem(_prev: RegistryFormState, fd: FormData): Promise<RegistryFormState> {
  const id = readText(fd, "id", 36);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "Invalid item." };

  const name = readText(fd, "name", 120);
  if (!name) return { ok: false, error: "What's the item?" };

  const priority = readEnum(fd, "priority", REGISTRY_PRIORITIES);
  if (!priority) return { ok: false, error: "Choose a priority." };

  const rawUrl = readText(fd, "url", 500);
  const url = safeUrl(rawUrl);
  if (rawUrl && !url) return { ok: false, error: "That link doesn't look right." };

  const price = readNumber(fd, "price", 0, 10_000_000);
  if (price === undefined) return { ok: false, error: "Please check the price." };

  const values = { name, priority, url, price, category: readText(fd, "category", 60) };

  const { supabase, ownerId } = await getSpace();
  const { error } = id
    ? await supabase.from("registry_items").update(values).eq("id", id).eq("user_id", ownerId)
    : await supabase.from("registry_items").insert({ ...values, user_id: ownerId });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setRegistryStatus(id: string, status: RegistryStatus): Promise<void> {
  if (!UUID_RE.test(id) || !REGISTRY_STATUSES.includes(status)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("registry_items").update({ status }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function deleteRegistryItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("registry_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Seeds the registry from the Smart Budget starter kit (skips names already present). */
export async function importRegistryStarter(): Promise<void> {
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("registry_items").select("name").eq("user_id", ownerId);
  const existing = new Set((data ?? []).map((r) => (r.name as string).toLowerCase()));

  const rows = STARTER_KIT.filter((i) => !existing.has(i.label.toLowerCase())).map((i) => ({
    user_id: ownerId,
    name: i.label,
    priority: i.need_level === "essential" ? "must" : "nice",
  }));
  if (rows.length) await supabase.from("registry_items").insert(rows);
  refresh();
}
```

## `src/app/(app)/registry/page.tsx`

```tsx
import type { Metadata } from "next";
import { Gift, Sparkles } from "lucide-react";
import { AddRegistryItem } from "@/components/registry/add-registry-item";
import { RegistryRow } from "@/components/registry/registry-row";
import { ScriptSheet } from "@/components/roadmap/script-sheet";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PRIORITY_LABELS, REGISTRY_PRIORITIES, type RegistryItem } from "@/lib/registry";
import { getSpace } from "@/lib/space";
import { formatMoney } from "@/lib/utils";
import { importRegistryStarter } from "./actions";

export const metadata: Metadata = { title: "Registry" };

export default async function RegistryPage() {
  const { supabase, ownerId, profile } = await getSpace();
  const currency = profile?.currency ?? "USD";

  const { data } = await supabase
    .from("registry_items")
    .select("id, name, category, priority, url, price, status")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: true });

  const items: RegistryItem[] = (data ?? []).map((r) => ({
    ...(r as RegistryItem),
    price: r.price == null ? null : Number(r.price), // numeric arrives as string
  }));

  const must = items.filter((i) => i.priority === "must");
  const mustCovered = must.filter((i) => i.status !== "wanted").length;
  const stillNeeded = items.filter((i) => i.status === "wanted");
  const neededValue = stillNeeded.reduce((s, i) => s + (i.price ?? 0), 0);

  // A plain-text list people can read in WhatsApp — no public page needed.
  const shareText = [
    "Hi! 💛 Here's what we still need for baby:",
    "",
    ...REGISTRY_PRIORITIES.filter((p) => p !== "later").flatMap((p) => {
      const rows = stillNeeded.filter((i) => i.priority === p);
      if (!rows.length) return [];
      return [`${PRIORITY_LABELS[p].title}:`, ...rows.map((i) => `• ${i.name}${i.url ? ` — ${i.url}` : ""}`), ""];
    }),
    "Honestly, a home-cooked meal after the birth is the best gift of all. Thank you! 🤍",
  ].join("\n");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Registry</h1>
          <p className="mt-1 text-muted">One shared list, so nobody buys the same thing twice.</p>
        </div>
        {stillNeeded.length > 0 && (
          <ScriptSheet
            label="Share on WhatsApp"
            title="Share what you still need"
            text={shareText}
            tip="Send it to the person organizing gifts, and mark items as Bought when someone tells you."
          />
        )}
      </header>

      <section aria-label="Registry summary" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Must-haves covered</p>
          <p className="mt-1 font-display text-2xl">
            {mustCovered} of {must.length}
          </p>
          <ProgressBar value={must.length ? (mustCovered / must.length) * 100 : 0} label="Must-haves covered" tone="sage" className="mt-3" />
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Still needed</p>
          <p className="mt-1 font-display text-2xl">{stillNeeded.length} items</p>
          <p className="mt-3 text-xs text-muted">{neededValue ? `About ${formatMoney(neededValue, currency)}` : "Add prices to see the total"}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Received</p>
          <p className="mt-1 font-display text-2xl">{items.filter((i) => i.status === "received").length}</p>
          <p className="mt-3 text-xs text-muted">Remember the thank-you notes 💌</p>
        </Card>
      </section>

      {items.length === 0 && (
        <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">Start from the lean essentials</p>
              <p className="text-sm text-muted">The same must-haves as your Smart Budget — no fluff.</p>
            </div>
          </div>
          <form action={importRegistryStarter}>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Add essentials
            </button>
          </form>
        </Card>
      )}

      {REGISTRY_PRIORITIES.map((p) => {
        const rows = items.filter((i) => i.priority === p);
        return (
          <section key={p} aria-labelledby={`reg-${p}`}>
            <Card>
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`reg-${p}`} className="flex items-center gap-2 font-display text-2xl">
                  {p === "must" && <Gift className="size-5 text-brand" aria-hidden />}
                  {PRIORITY_LABELS[p].title}
                </h2>
                <p className="text-sm text-muted">{PRIORITY_LABELS[p].hint}</p>
              </div>
              {rows.length > 0 ? (
                <ul className="mt-2 divide-y divide-line">
                  {rows.map((i) => (
                    <RegistryRow key={i.id} item={i} currency={currency} />
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-muted">Nothing here yet.</p>
              )}
              <div className="mt-2 border-t border-line pt-3">
                <AddRegistryItem priority={p} currency={currency} />
              </div>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
```

## `src/components/registry/registry-form.tsx`

```tsx
"use client";

import { useActionState, useId, useState } from "react";
import { saveRegistryItem, type RegistryFormState } from "@/app/(app)/registry/actions";
import {
  PRIORITY_LABELS,
  REGISTRY_CATEGORY_SUGGESTIONS,
  REGISTRY_PRIORITIES,
  type RegistryItem,
  type RegistryPriority,
} from "@/lib/registry";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand";

type Props = { item?: RegistryItem; defaultPriority?: RegistryPriority; currency: string; onDone: () => void };

export function RegistryForm({ item, defaultPriority = "must", currency, onDone }: Props) {
  const [state, action, pending] = useActionState<RegistryFormState, FormData>(saveRegistryItem, { ok: false, error: null });

  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) onDone();
  }

  const listId = useId();
  const [f, setF] = useState({
    name: item?.name ?? "",
    priority: item?.priority ?? defaultPriority,
    category: item?.category ?? "",
    url: item?.url ?? "",
    price: item?.price != null ? String(item.price) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Item</span>
          <input name="name" required maxLength={120} value={f.name} onChange={set("name")} placeholder="e.g. Baby carrier" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Priority</span>
          <select name="priority" value={f.priority} onChange={set("priority")} className={inputClass}>
            {REGISTRY_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p].title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <input name="category" list={listId} maxLength={60} value={f.category} onChange={set("category")} placeholder="Optional" className={inputClass} />
          <datalist id={listId}>
            {REGISTRY_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Link</span>
          <input name="url" type="text" inputMode="url" maxLength={500} value={f.url} onChange={set("url")} placeholder="Shop link (optional)" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Price ({currency})</span>
          <input name="price" type="number" min={0} step="any" inputMode="decimal" value={f.price} onChange={set("price")} className={inputClass} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-brand-strong">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Saving…" : item ? "Save changes" : "Add to registry"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## `src/components/registry/add-registry-item.tsx`

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { RegistryPriority } from "@/lib/registry";
import { RegistryForm } from "./registry-form";

export function AddRegistryItem({ priority, currency }: { priority: RegistryPriority; currency: string }) {
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
        <Plus className="size-4" aria-hidden /> Add item
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <RegistryForm key={key} defaultPriority={priority} currency={currency} onDone={() => setOpen(false)} />
    </div>
  );
}
```

## `src/components/registry/registry-row.tsx`

```tsx
"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteRegistryItem, setRegistryStatus } from "@/app/(app)/registry/actions";
import { REGISTRY_STATUSES, STATUS_LABELS, type RegistryItem, type RegistryStatus } from "@/lib/registry";
import { cn, formatMoney } from "@/lib/utils";
import { RegistryForm } from "./registry-form";

const STATUS_STYLES: Record<RegistryStatus, string> = {
  wanted: "bg-canvas text-ink",
  purchased: "bg-sage-soft text-sage",
  received: "bg-sage text-white",
};

export function RegistryRow({ item, currency }: { item: RegistryItem; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useOptimistic(item.status);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  if (editing) {
    return (
      <li className="py-4">
        <RegistryForm item={item} currency={currency} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center", pending && "opacity-70")}>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", status !== "wanted" && "text-muted")}>
          {item.name}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open link for ${item.name}`}
              className="ml-1.5 inline-flex align-middle text-brand hover:text-brand-strong"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {[item.category, item.price != null ? formatMoney(item.price, currency) : null].filter(Boolean).join(" · ") ||
            "No price yet"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <label className="sr-only" htmlFor={`status-${item.id}`}>
          Status
        </label>
        <select
          id={`status-${item.id}`}
          value={status}
          onChange={(e) =>
            startTransition(async () => {
              const next = e.target.value as RegistryStatus;
              setStatus(next);
              await setRegistryStatus(item.id, next);
            })
          }
          className={cn("rounded-full border-0 py-1.5 pr-7 pl-3 text-xs font-semibold", STATUS_STYLES[status])}
        >
          {REGISTRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink">
          <Pencil className="size-4" />
        </button>
        {confirmDelete ? (
          <button
            type="button"
            onBlur={() => setConfirmDelete(false)}
            onClick={() =>
              startTransition(async () => {
                setRemoved(true);
                await deleteRegistryItem(item.id);
              })
            }
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"
          >
            Delete?
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${item.name}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}
```

## `src/app/(app)/hospital-bag/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { UUID_RE, readEnum, readText } from "@/lib/form";
import { BAGS, DEFAULT_BAG, type Bag } from "@/lib/hospital-bag";
import { getSpace } from "@/lib/space";

export type BagFormState = { ok: boolean; error: string | null };

function refresh() {
  revalidatePath("/hospital-bag");
  revalidatePath("/dashboard");
}

export async function setPacked(id: string, packed: boolean): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").update({ is_packed: packed }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

export async function addBagItem(_prev: BagFormState, fd: FormData): Promise<BagFormState> {
  const bag = readEnum(fd, "bag", BAGS);
  const label = readText(fd, "label", 120);
  if (!bag) return { ok: false, error: "Choose a bag." };
  if (!label) return { ok: false, error: "What do you want to pack?" };

  const { supabase, ownerId } = await getSpace();
  const { data: last } = await supabase
    .from("hospital_bag_items")
    .select("sort_order")
    .eq("user_id", ownerId)
    .eq("bag", bag)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("hospital_bag_items").insert({
    user_id: ownerId,
    bag,
    label,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null };
}

export async function deleteBagItem(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Re-adds any suggested items missing from a bag (never duplicates). */
export async function restoreSuggestions(bag: Bag): Promise<void> {
  if (!BAGS.includes(bag)) return;
  const { supabase, ownerId } = await getSpace();
  const { data } = await supabase.from("hospital_bag_items").select("label").eq("user_id", ownerId).eq("bag", bag);
  const existing = new Set((data ?? []).map((r) => (r.label as string).toLowerCase()));

  const rows = DEFAULT_BAG[bag]
    .map((label, i) => ({ user_id: ownerId, bag, label, sort_order: i + 1 }))
    .filter((r) => !existing.has(r.label.toLowerCase()));
  if (rows.length) await supabase.from("hospital_bag_items").insert(rows);
  refresh();
}

/** Unticks everything in a bag — handy for a re-check at week 37. */
export async function unpackAll(bag: Bag): Promise<void> {
  if (!BAGS.includes(bag)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("hospital_bag_items").update({ is_packed: false }).eq("user_id", ownerId).eq("bag", bag);
  refresh();
}
```

## `src/app/(app)/hospital-bag/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Baby, Luggage, RotateCcw, Sparkles, User } from "lucide-react";
import { BagAddForm } from "@/components/bag/bag-add-form";
import { BagItemRow } from "@/components/bag/bag-item-row";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BAGS, DEFAULT_BAG, PACK_BY_WEEK, type Bag, type BagItem } from "@/lib/hospital-bag";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { cn } from "@/lib/utils";
import { restoreSuggestions, unpackAll } from "./actions";

export const metadata: Metadata = { title: "Hospital bag" };

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export default async function HospitalBagPage({ searchParams }: { searchParams: Promise<{ bag?: string }> }) {
  const params = await searchParams;
  const { supabase, ownerId, role, profile } = await getSpace();

  const { data } = await supabase
    .from("hospital_bag_items")
    .select("id, bag, label, is_packed, sort_order")
    .eq("user_id", ownerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data ?? []) as BagItem[];
  // Partners open on their own bag by default.
  const fallback: Bag = role === "partner" ? "partner" : "mom";
  const active: Bag = BAGS.includes(params.bag as Bag) ? (params.bag as Bag) : fallback;

  // Labels relative to the viewer
  const momName = role === "owner" ? "Your bag" : `${profile?.full_name || "Mom"}'s bag`;
  const partnerName = role === "partner" ? "Your bag" : `${profile?.partner_name || "Partner"}'s bag`;
  const TABS: Record<Bag, { label: string; icon: typeof Luggage }> = {
    mom: { label: momName, icon: Luggage },
    baby: { label: "Baby's bag", icon: Baby },
    partner: { label: partnerName, icon: User },
  };

  const byBag = (b: Bag) => items.filter((i) => i.bag === b);
  const packedIn = (b: Bag) => byBag(b).filter((i) => i.is_packed).length;
  const totalPacked = items.filter((i) => i.is_packed).length;

  const activeItems = byBag(active);
  const missingSuggestions = DEFAULT_BAG[active].filter(
    (label) => !activeItems.some((i) => i.label.toLowerCase() === label.toLowerCase()),
  ).length;

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const weeksUntilPack = status ? PACK_BY_WEEK - status.week : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Hospital bag</h1>
        <p className="mt-1 text-muted">Three bags, one shared checklist — tick things off together.</p>
      </header>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {totalPacked} of {items.length} packed
          </p>
          <ProgressBar value={pct(totalPacked, items.length)} label="All bags packed" tone="sage" className="mt-2 max-w-md" />
        </div>
        <p className="text-sm text-muted sm:text-right">
          {weeksUntilPack === null
            ? `Aim to be ready by week ${PACK_BY_WEEK}.`
            : weeksUntilPack > 0
              ? `Ready by week ${PACK_BY_WEEK} — that's ${weeksUntilPack} week${weeksUntilPack === 1 ? "" : "s"} from now.`
              : "Keep the bags by the door and the car ready. 🚗"}
        </p>
      </Card>

      {/* Tabs */}
      <nav aria-label="Bags" className="grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
        {BAGS.map((b) => {
          const Icon = TABS[b].icon;
          const total = byBag(b).length;
          return (
            <Link
              key={b}
              href={`/hospital-bag?bag=${b}`}
              aria-current={active === b ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-sm font-semibold sm:flex-row sm:justify-center sm:gap-2",
                active === b ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="truncate">{TABS[b].label}</span>
              <span className="text-xs font-normal">
                {packedIn(b)}/{total}
              </span>
            </Link>
          );
        })}
      </nav>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{TABS[active].label}</h2>
          {packedIn(active) > 0 && (
            <form action={unpackAll.bind(null, active)}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink">
                <RotateCcw className="size-3.5" aria-hidden /> Re-check all
              </button>
            </form>
          )}
        </div>

        {activeItems.length > 0 ? (
          <ul className="mt-2 divide-y divide-line">
            {activeItems.map((i) => (
              <BagItemRow key={i.id} item={i} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted">This bag is empty.</p>
        )}

        <div className="mt-3 space-y-3 border-t border-line pt-4">
          <BagAddForm key={active} bag={active} />
          {missingSuggestions > 0 && (
            <form action={restoreSuggestions.bind(null, active)}>
              <button type="submit" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong">
                <Sparkles className="size-4" aria-hidden /> Add {missingSuggestions} suggested item{missingSuggestions === 1 ? "" : "s"}
              </button>
            </form>
          )}
        </div>
      </Card>

      {active === "baby" && (
        <p className="rounded-xl bg-sage-soft p-4 text-sm">
          💡 Many hospitals expect a properly installed car seat before you drive home. Get the installation checked by a certified technician if you can.
        </p>
      )}
    </div>
  );
}
```

## `src/components/bag/bag-item-row.tsx`

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X } from "lucide-react";
import { deleteBagItem, setPacked } from "@/app/(app)/hospital-bag/actions";
import type { BagItem } from "@/lib/hospital-bag";
import { cn } from "@/lib/utils";

export function BagItemRow({ item }: { item: BagItem }) {
  const [, startTransition] = useTransition();
  const [packed, setOptimisticPacked] = useOptimistic(item.is_packed);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  return (
    <li className="group flex items-center gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={packed}
        onClick={() =>
          startTransition(async () => {
            setOptimisticPacked(!packed);
            await setPacked(item.id, !packed);
          })
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
            packed ? "border-sage bg-sage text-white" : "border-line group-hover:border-sage",
          )}
        >
          {packed && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
        </span>
        <span className={cn("min-w-0", packed && "text-muted line-through")}>{item.label}</span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${item.label}`}
        onClick={() =>
          startTransition(async () => {
            setRemoved(true);
            await deleteBagItem(item.id);
          })
        }
        className="rounded-lg p-1.5 text-muted opacity-60 hover:bg-canvas hover:text-brand-strong hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
```

## `src/components/bag/bag-add-form.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addBagItem, type BagFormState } from "@/app/(app)/hospital-bag/actions";
import type { Bag } from "@/lib/hospital-bag";

export function BagAddForm({ bag }: { bag: Bag }) {
  const [state, action, pending] = useActionState<BagFormState, FormData>(addBagItem, { ok: false, error: null });

  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="bag" value={bag} />
      <label className="sr-only" htmlFor={`add-${bag}`}>
        Add an item
      </label>
      <input
        id={`add-${bag}`}
        name="label"
        required
        maxLength={120}
        placeholder="Add something else to pack…"
        className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Add item"
        className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink/90 disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden /> <span className="hidden sm:inline">Add</span>
      </button>
      {state.error && (
        <p role="alert" className="sr-only">
          {state.error}
        </p>
      )}
    </form>
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
  const { data: updated, error } = await supabase
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
    .eq("id", user.id)
    .select("id");

  // Supabase doesn't error on 0-row updates — check explicitly.
  if (error || !updated?.length) {
    console.error("[budget] leave plan update failed", { userId: user.id, error, rows: updated?.length ?? 0 });
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, error: null, savedAt: Date.now() };
}
```

## `src/app/(app)/appointments/print/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { addDays, isIsoDate, isoToday } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export type FormState = { ok: boolean; error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(fd: FormData, key: string, max: number) {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s.length ? s : null;
}

function refresh() {
  revalidatePath("/appointments/print");
  revalidatePath("/questions");
  revalidatePath("/dashboard");
}

/* ---------------- Symptoms ---------------- */

export async function addSymptom(_prev: FormState, fd: FormData): Promise<FormState> {
  const symptom = text(fd, "symptom", 200);
  if (!symptom) return { ok: false, error: "What are you noticing? Add a few words." };

  const severity = Number(fd.get("severity"));
  if (![1, 2, 3].includes(severity)) return { ok: false, error: "Choose how strong it is." };

  const loggedOn = String(fd.get("logged_on") ?? "");
  const today = isoToday();
  // +1 day of slack for timezones ahead of UTC
  if (!isIsoDate(loggedOn) || loggedOn > addDays(today, 1) || loggedOn < addDays(today, -300)) {
    return { ok: false, error: "Please pick a valid date." };
  }

  const { supabase, ownerId } = await getSpace();
  const { error } = await supabase.from("symptom_logs").insert({
    user_id: ownerId,
    symptom,
    severity,
    logged_on: loggedOn,
    notes: text(fd, "notes", 500),
  });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null };
}

export async function deleteSymptom(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("symptom_logs").delete().eq("id", id).eq("user_id", ownerId);
  refresh();
}

/* ---------------- Questions ---------------- */

export async function addQuestion(_prev: FormState, fd: FormData): Promise<FormState> {
  const question = text(fd, "question", 300);
  if (!question) return { ok: false, error: "Type your question first." };

  const appointmentId = text(fd, "appointment_id", 36);
  if (appointmentId && !UUID.test(appointmentId)) return { ok: false, error: "Invalid appointment." };

  const { supabase, ownerId } = await getSpace();
  const { error } = await supabase.from("doctor_questions").insert({
    user_id: ownerId,
    question,
    is_priority: fd.get("is_priority") === "on",
    appointment_id: appointmentId,
  });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true, error: null };
}

export async function setQuestionPriority(id: string, isPriority: boolean): Promise<void> {
  if (!UUID.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").update({ is_priority: isPriority }).eq("id", id).eq("user_id", ownerId);
  refresh();
}

/** Marks a question as asked — it drops off future printouts. */
export async function setQuestionAsked(id: string, isAsked: boolean): Promise<void> {
  if (!UUID.test(id)) return;
  const { supabase, ownerId } = await getSpace();
  await supabase.from("doctor_questions").update({ is_asked: isAsked }).eq("id", id).eq("user_id", ownerId);
  refresh();
}
```

## `src/app/onboarding/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURRENCIES } from "@/lib/money";
import { dueDateFromLmp, validateDueDate, validateLmp } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export type OnboardingState = { error: string | null; step?: number };

const WORK_STATUS = ["not_yet", "told", "not_applicable"] as const;
const VISITOR_POLICY = ["welcome", "limited", "none_first_weeks"] as const;

function text(fd: FormData, key: string, max: number) {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s.length ? s : null;
}

/** Optional number in [min, max]; returns undefined when invalid. */
function num(fd: FormData, key: string, min: number, max: number): number | null | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // ---- Step 1: due date
  const mode = formData.get("mode");
  const date = String(formData.get("date") ?? "");
  let dueDate: string;
  if (mode === "due") {
    const error = validateDueDate(date);
    if (error) return { error, step: 0 };
    dueDate = date;
  } else if (mode === "lmp") {
    const error = validateLmp(date);
    if (error) return { error, step: 0 };
    dueDate = dueDateFromLmp(date);
  } else {
    return { error: "Please choose how you'd like to set your due date.", step: 0 };
  }

  // ---- Step 3: money (all optional, but must be sane if given)
  const momIncome = num(formData, "mom_monthly_income", 0, 10_000_000);
  const partnerIncome = num(formData, "partner_monthly_income", 0, 10_000_000);
  const leaveWeeks = num(formData, "mom_leave_weeks", 0, 104);
  const paidWeeks = num(formData, "mom_paid_weeks", 0, 104);
  const payPercent = num(formData, "mom_leave_pay_percent", 0, 100);
  const partnerLeave = num(formData, "partner_leave_weeks", 0, 104);
  if ([momIncome, partnerIncome, leaveWeeks, paidWeeks, payPercent, partnerLeave].includes(undefined)) {
    return { error: "Please check the numbers — some values are out of range.", step: 2 };
  }
  if (leaveWeeks != null && paidWeeks != null && paidWeeks > leaveWeeks) {
    return { error: "Paid weeks can't be more than your total leave weeks.", step: 2 };
  }

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") redirect("/dashboard");

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      due_date: dueDate,
      full_name: text(formData, "full_name", 80),
      partner_name: text(formData, "partner_name", 80),
      hospital_name: text(formData, "hospital_name", 120),
      currency: oneOf(formData.get("currency"), CURRENCIES, "USD"),
      mom_monthly_income: momIncome,
      partner_monthly_income: partnerIncome,
      mom_leave_weeks: leaveWeeks,
      mom_paid_weeks: paidWeeks,
      mom_leave_pay_percent: payPercent,
      partner_leave_weeks: partnerLeave,
      work_status: oneOf(formData.get("work_status"), WORK_STATUS, "not_yet"),
      visitor_policy: oneOf(formData.get("visitor_policy"), VISITOR_POLICY, "limited"),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id");

  // Supabase does NOT error when an update matches 0 rows (missing profile or RLS),
  // so check the returned rows explicitly.
  if (error || !updated?.length) {
    console.error("[onboarding] profile update failed", {
      userId: user.id,
      error,
      rowsUpdated: updated?.length ?? 0,
    });
    return {
      error: error
        ? "We couldn't save your plan. Please try again."
        : "Your profile wasn't found. Please sign out and in again, or contact support.",
    };
  }

  // ---- Step 2: Co-Pilot invite (only if none is pending already)
  const wantsCoPilot = formData.get("invite_partner") === "on";
  if (wantsCoPilot) {
    const { count } = await supabase
      .from("partner_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());
    if (!count) await supabase.from("partner_invites").insert({});
  }

  revalidatePath("/", "layout");
  redirect(wantsCoPilot ? "/co-pilot?welcome=1" : "/dashboard");
}
```


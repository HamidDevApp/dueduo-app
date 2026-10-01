import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { PrintButton } from "@/components/printout/print-button";
import { PrintoutSheet } from "@/components/printout/printout-sheet";
import { QuestionForm } from "@/components/printout/question-form";
import { QuestionItem } from "@/components/printout/question-item";
import { SymptomForm } from "@/components/printout/symptom-form";
import { SymptomItem } from "@/components/printout/symptom-item";
import type { AppointmentRow, QuestionRow, SymptomRow } from "@/components/printout/types";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { addDays, getPregnancyStatus, isoToday } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Doctor visit printout" };

const SYMPTOM_WINDOW_DAYS = 28;

export default async function VisitPrintoutPage({
  searchParams,
}: {
  searchParams: Promise<{ appt?: string }>;
}) {
  const { appt } = await searchParams;
  const { supabase, ownerId, profile } = await getSpace();
  const today = isoToday();

  // Upcoming appointments (include ones from the last 12h, so today's visit still shows)
  const since = new Date(Date.now() - 12 * 3_600_000).toISOString();
  const [apptsRes, membersRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, title, kind, scheduled_at, location, provider_name")
      .eq("user_id", ownerId)
      .eq("is_done", false)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: true })
      .limit(6),
    supabase.from("pregnancy_members").select("member_id").eq("owner_id", ownerId),
  ]);

  const upcoming = (apptsRes.data ?? []) as AppointmentRow[];
  const appointment = upcoming.find((a) => a.id === appt) ?? upcoming[0] ?? null;
  const partnerIds = new Set((membersRes.data ?? []).map((m) => m.member_id as string));
  const partnerName = profile?.partner_name || "partner";

  // Symptoms since the previous visit (or the last 4 weeks if there isn't one)
  let symptomsSince = addDays(today, -SYMPTOM_WINDOW_DAYS);
  if (appointment) {
    const { data: prev } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("user_id", ownerId)
      .lt("scheduled_at", appointment.scheduled_at)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prev?.scheduled_at) symptomsSince = (prev.scheduled_at as string).slice(0, 10);
  }

  // Open questions for this visit: unassigned ones + ones attached to it
  let questionsQuery = supabase
    .from("doctor_questions")
    .select("id, question, is_priority, created_by, created_at")
    .eq("user_id", ownerId)
    .eq("is_asked", false);
  questionsQuery = appointment
    ? questionsQuery.or(`appointment_id.is.null,appointment_id.eq.${appointment.id}`)
    : questionsQuery.is("appointment_id", null);

  const [questionsRes, symptomsRes] = await Promise.all([
    questionsQuery.order("is_priority", { ascending: false }).order("created_at", { ascending: true }),
    supabase
      .from("symptom_logs")
      .select("id, logged_on, symptom, severity, notes")
      .eq("user_id", ownerId)
      .gte("logged_on", symptomsSince)
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const questions = (questionsRes.data ?? []) as QuestionRow[];
  const symptoms = (symptomsRes.data ?? []) as SymptomRow[];
  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Screen-only header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Doctor visit printout</h1>
          <p className="mt-1 text-muted">
            Log symptoms, star your must-ask questions, then print — so nothing is forgotten in the room.
          </p>
        </div>
        <PrintButton />
      </header>

      {/* Appointment picker */}
      <nav aria-label="Choose appointment" className="flex flex-wrap gap-2 print:hidden">
        {upcoming.map((a) => (
          <Link
            key={a.id}
            href={`/appointments/print?appt=${a.id}`}
            aria-current={appointment?.id === a.id ? "page" : undefined}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              appointment?.id === a.id
                ? "border-brand bg-brand-soft font-semibold text-brand-strong"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {a.title} · <LocalDateTime iso={a.scheduled_at} />
          </Link>
        ))}
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2 text-sm text-muted hover:text-ink"
        >
          <CalendarPlus className="size-4" aria-hidden /> {upcoming.length ? "Add another" : "Add your next appointment"}
        </Link>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] print:block">
        {/* Prep panel — never printed */}
        <div className="space-y-6 print:hidden">
          <Card>
            <h2 className="font-semibold">1. Log how you&apos;ve been feeling</h2>
            <p className="mt-1 text-sm text-muted">
              Anything unusual, even small things. Doctors find patterns useful.
            </p>
            <div className="mt-4">
              <SymptomForm today={today} />
            </div>
            {symptoms.length > 0 && (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {symptoms.map((s) => (
                  <SymptomItem key={s.id} row={s} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">2. Pick your must-ask questions</h2>
            <p className="mt-1 text-sm text-muted">
              Star the ones you can&apos;t leave without asking — they go to the top of the page.
            </p>
            <div className="mt-4">
              <QuestionForm appointmentId={appointment?.id ?? null} />
            </div>
            {questions.length > 0 ? (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {questions.map((q) => (
                  <QuestionItem
                    key={q.id}
                    id={q.id}
                    question={q.question}
                    isPriority={q.is_priority}
                    addedBy={q.created_by && partnerIds.has(q.created_by) ? partnerName : undefined}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">No open questions yet.</p>
            )}
          </Card>
        </div>

        {/* Preview — this is what prints */}
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase print:hidden">Preview</p>
          <PrintoutSheet
            profile={profile}
            status={status}
            appointment={appointment}
            questions={questions}
            symptoms={symptoms}
            symptomsSince={symptomsSince}
            printedOn={today}
            partnerIds={partnerIds}
          />
        </div>
      </div>
    </div>
  );
}

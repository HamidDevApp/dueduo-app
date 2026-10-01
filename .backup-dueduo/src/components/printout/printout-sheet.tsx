import { LocalDateTime } from "@/components/ui/local-date-time";
import type { PregnancyStatus } from "@/lib/pregnancy";
import type { SpaceProfile } from "@/lib/space";
import { formatLongDate } from "@/lib/utils";
import { SEVERITY_LABELS, type AppointmentRow, type QuestionRow, type SymptomRow } from "./types";

type Props = {
  profile: SpaceProfile | null;
  status: PregnancyStatus | null;
  appointment: AppointmentRow | null;
  questions: QuestionRow[];
  symptoms: SymptomRow[];
  symptomsSince: string;
  printedOn: string;
  partnerIds: Set<string>;
};

function Lines({ count }: { count: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-7 border-b border-dotted border-black/30" />
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break mt-6">
      <h3 className="border-b border-black/80 pb-1 text-xs font-bold tracking-widest uppercase">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** The printable one-pager. Styled to look good on screen (preview) and on A4 paper. */
export function PrintoutSheet({
  profile,
  status,
  appointment,
  questions,
  symptoms,
  symptomsSince,
  printedOn,
  partnerIds,
}: Props) {
  const priority = questions.filter((q) => q.is_priority);
  const other = questions.filter((q) => !q.is_priority);

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-white p-6 text-[13px] leading-relaxed text-black shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase">Prenatal visit summary</p>
          <h2 className="mt-1 font-display text-2xl">{profile?.full_name || "Patient"}</h2>
        </div>
        <p className="text-right text-[11px] text-black/70">Prepared {formatLongDate(printedOn)}</p>
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Due date</dt>
          <dd className="font-semibold">{profile?.due_date ? formatLongDate(profile.due_date) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Gestational age</dt>
          <dd className="font-semibold">
            {status ? `${status.week}w ${status.day}d · Trimester ${status.trimester}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Appointment</dt>
          <dd className="font-semibold">
            {appointment ? (
              <>
                {appointment.title} · <LocalDateTime iso={appointment.scheduled_at} />
              </>
            ) : (
              "Not scheduled"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Provider / location</dt>
          <dd className="font-semibold">
            {[appointment?.provider_name, appointment?.location].filter(Boolean).join(" · ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Birth place</dt>
          <dd className="font-semibold">{profile?.hospital_name || "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-black/60 uppercase">Support person</dt>
          <dd className="font-semibold">{profile?.partner_name || "—"}</dd>
        </div>
      </dl>

      {/* Questions */}
      <Section title={`Must-ask questions (${priority.length})`}>
        {priority.length === 0 ? (
          <p className="text-black/60">None marked as priority.</p>
        ) : (
          <ol className="list-decimal space-y-3 pl-5">
            {priority.map((q) => (
              <li key={q.id}>
                <p className="font-semibold">
                  {q.question}
                  {q.created_by && partnerIds.has(q.created_by) && (
                    <span className="ml-1 font-normal text-black/60">(from partner)</span>
                  )}
                </p>
                <Lines count={2} />
              </li>
            ))}
          </ol>
        )}
      </Section>

      {other.length > 0 && (
        <Section title="Other questions">
          <ol className="list-decimal space-y-2 pl-5" start={priority.length + 1}>
            {other.map((q) => (
              <li key={q.id}>
                {q.question}
                <Lines count={1} />
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Symptoms */}
      <Section title={`Symptoms since ${formatLongDate(symptomsSince)}`}>
        {symptoms.length === 0 ? (
          <p className="text-black/60">No symptoms logged.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] text-black/60 uppercase">
                <th className="py-1 pr-3 font-semibold">Date</th>
                <th className="py-1 pr-3 font-semibold">Symptom</th>
                <th className="py-1 pr-3 font-semibold">Severity</th>
                <th className="py-1 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {symptoms.map((s) => (
                <tr key={s.id} className="border-t border-black/15 align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatLongDate(s.logged_on)}</td>
                  <td className="py-1.5 pr-3">{s.symptom}</td>
                  <td className={s.severity === 3 ? "py-1.5 pr-3 font-bold" : "py-1.5 pr-3"}>
                    {SEVERITY_LABELS[s.severity]}
                  </td>
                  <td className="py-1.5 text-black/75">{s.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Visit notes */}
      <Section title="Notes from today's visit">
        <Lines count={5} />
        <p className="mt-3 text-[11px] text-black/70">Next appointment: ______________________ &nbsp; Tests ordered: ______________________</p>
      </Section>

      <footer className="mt-6 border-t border-black/20 pt-2 text-[10px] text-black/55">
        Prepared with First Pregnancy Planner. For organization only — not medical advice.
      </footer>
    </article>
  );
}

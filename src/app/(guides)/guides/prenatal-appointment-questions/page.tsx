import type { Metadata } from "next";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { GuidePrintButton } from "@/components/guides/print-button";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";
import { QUESTION_IDEAS } from "@/lib/question-ideas";

const guide = GUIDES.questions;
export const metadata: Metadata = guideMetadata(guide);

const PARTNER_QUESTIONS = [
  "If something worries us at night or on a weekend, who do we call?",
  "Can I be there for the scans and the birth, and are there limits on visitors?",
  "What should I know about getting to the hospital: parking, which entrance, what to bring?",
  "What can I do to help during labor?",
  "Which signs of depression or anxiety after the birth should we watch for, in either of us?",
];

const SECTIONS = [
  { title: "First trimester", questions: QUESTION_IDEAS[1] },
  { title: "Second trimester", questions: QUESTION_IDEAS[2] },
  { title: "Third trimester", questions: QUESTION_IDEAS[3] },
  { title: "For the partner to ask", questions: PARTNER_QUESTIONS },
];

export default function PrenatalQuestionsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 print:p-0">
      <GuideHeader guide={guide} />

      {/* Screen version */}
      <div className="print:hidden">
        <Prose className="mt-6">
          <p>
            Appointments go fast, and the questions often come to mind on the drive home. Write them down before you go.
            Below are common questions sorted by trimester, plus a few for the partner to ask.
          </p>
          <p>
            <strong>How often you&apos;ll go.</strong> In the US, visits are usually monthly until 28 weeks, every 2
            weeks from 28 to 36 weeks, then weekly until the birth (<SourceLink source={SOURCES.nichd}>NICHD</SourceLink>
            ). In the UK, a first pregnancy usually includes at least 10 midwife appointments and 2 scans (
            <SourceLink source={SOURCES.nhs}>NHS</SourceLink>).
          </p>
          <p>
            <strong>Go together if you can.</strong> The NHS says partners can come to appointments if you&apos;d like
            them to. Agree beforehand who asks what, and who writes down the answers.
          </p>
        </Prose>

        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <ol className="mt-4 list-decimal space-y-2.5 pl-5 leading-snug marker:font-semibold marker:text-brand-strong">
                {s.questions.map((q) => (
                  <li key={q} className="pl-1">{q}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <Prose className="mt-8">
          <p>
            Tests and timings differ by country and by hospital, so some of these may not apply to you. In the UK, for
            example, the glucose test is only offered if you have a higher chance of gestational diabetes (
            <SourceLink source={SOURCES.nhs}>NHS</SourceLink>).
          </p>
        </Prose>
        <div className="mt-6">
          <GuidePrintButton>Print these questions</GuidePrintButton>
        </div>

        <GuideCta>
          In DueDuo, you both add questions as they come up between visits. Before each appointment, you print them on one
          page with a 28-day symptom log and the appointment details.
        </GuideCta>
        <Sources sources={[SOURCES.nichd, SOURCES.nhs]} />
      </div>

      {/* Print version: one page, all 20 questions, with a line for each answer */}
      <div className="hidden columns-2 gap-8 pt-4 text-[10pt] leading-tight print:block">
        {SECTIONS.map((s) => (
          <section key={s.title} className="mb-5 break-inside-avoid">
            <h2 className="mb-1 font-display text-[11pt] font-semibold">{s.title}</h2>
            <ol className="list-decimal space-y-1 pl-4">
              {s.questions.map((q) => (
                <li key={q}>
                  {q}
                  <div className="mt-7 border-b border-ink/40" />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </article>
  );
}

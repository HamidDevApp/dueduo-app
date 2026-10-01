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

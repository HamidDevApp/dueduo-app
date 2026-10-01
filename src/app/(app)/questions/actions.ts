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

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

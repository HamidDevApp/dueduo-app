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

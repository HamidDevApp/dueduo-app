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

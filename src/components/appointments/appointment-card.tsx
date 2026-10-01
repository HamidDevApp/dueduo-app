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

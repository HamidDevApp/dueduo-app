import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import { AddAppointment } from "@/components/appointments/add-appointment";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import type { Appointment } from "@/lib/appointments";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Appointments" };

/** Distinct, non-empty values, most recent first. */
function distinct(values: (string | null)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].slice(0, 20);
}

export default async function AppointmentsPage() {
  const { supabase, ownerId } = await getSpace();

  const [apptsRes, questionsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, title, kind, scheduled_at, location, provider_name, notes, is_done")
      .eq("user_id", ownerId)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("doctor_questions")
      .select("appointment_id")
      .eq("user_id", ownerId)
      .eq("is_asked", false),
  ]);

  const all = (apptsRes.data ?? []) as Appointment[];
  const now = Date.now();
  const graceMs = 12 * 3_600_000; // today's visit stays "upcoming" for 12h, matching the printout

  const upcoming = all.filter((a) => !a.is_done && new Date(a.scheduled_at).getTime() >= now - graceMs);
  const needsUpdate = all.filter((a) => !a.is_done && new Date(a.scheduled_at).getTime() < now - graceMs);
  const done = all.filter((a) => a.is_done).reverse();

  // Suggestions for the provider/location pickers (most recent first)
  const recentFirst = [...all].reverse();
  const providers = distinct(recentFirst.map((a) => a.provider_name));
  const locations = distinct(recentFirst.map((a) => a.location));

  // Questions not tied to a visit count toward the next one, like on the printout
  const questions = questionsRes.data ?? [];
  const unassigned = questions.filter((q) => !q.appointment_id).length;
  const openFor = (a: Appointment, isNext: boolean) =>
    questions.filter((q) => q.appointment_id === a.id).length + (isNext ? unassigned : 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Appointments</h1>
          <p className="mt-1 text-muted">Every visit in one place — shared with your Co-Pilot and ready to print.</p>
        </div>
        {upcoming.length > 0 && (
          <Link
            href="/appointments/print"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-canvas"
          >
            <Printer className="size-4" aria-hidden /> Next visit printout
          </Link>
        )}
      </header>

      <AddAppointment providers={providers} locations={locations} startOpen={all.length === 0} />

      {needsUpdate.length > 0 && (
        <section aria-labelledby="needs-update" className="space-y-3">
          <h2 id="needs-update" className="font-display text-xl">
            Needs an update
          </h2>
          {needsUpdate.map((a) => (
            <AppointmentCard key={a.id} appointment={a} providers={providers} locations={locations} variant="needs-update" />
          ))}
        </section>
      )}

      <section aria-labelledby="upcoming" className="space-y-3">
        <h2 id="upcoming" className="font-display text-xl">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Nothing booked yet. Use Quick add above — you only need to pick the date.</p>
        ) : (
          upcoming.map((a, i) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              providers={providers}
              locations={locations}
              variant={i === 0 ? "next" : "upcoming"}
              openQuestions={openFor(a, i === 0)}
            />
          ))
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="past" className="space-y-3">
          <h2 id="past" className="font-display text-xl">
            Past visits
          </h2>
          {done.map((a) => (
            <AppointmentCard key={a.id} appointment={a} providers={providers} locations={locations} variant="done" />
          ))}
        </section>
      )}
    </div>
  );
}

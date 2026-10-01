"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AppointmentForm } from "./appointment-form";

export function AddAppointment({ providers, locations, startOpen = false }: { providers: string[]; locations: string[]; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  // Remount the form on each open so it starts empty.
  const [formKey, setFormKey] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setFormKey((k) => k + 1);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        <Plus className="size-4" aria-hidden /> Add appointment
      </button>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 font-semibold">New appointment</h2>
      <AppointmentForm key={formKey} providers={providers} locations={locations} onDone={() => setOpen(false)} />
    </Card>
  );
}

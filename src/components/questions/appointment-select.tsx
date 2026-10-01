"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/utils";
import type { AppointmentOption } from "./types";

type Props = {
  appointments: AppointmentOption[];
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

const subscribe = () => () => {};

/** "Next visit (any)" + upcoming appointments, with dates in the viewer's timezone. */
export function AppointmentSelect({ appointments, name, value, onChange, className }: Props) {
  // Server render shows titles only; the browser adds local dates after hydration (no mismatch).
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <select
      name={name}
      value={value}
      defaultValue={value === undefined ? "" : undefined}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        className ??
        "max-w-[16rem] rounded-lg border border-line bg-surface py-1.5 pr-7 pl-2 text-sm outline-none focus:border-brand"
      }
    >
      <option value="">Next visit (any)</option>
      {appointments.map((a) => (
        <option key={a.id} value={a.id}>
          {isClient ? `${a.title} · ${formatDateTime(a.scheduled_at)}` : a.title}
        </option>
      ))}
    </select>
  );
}

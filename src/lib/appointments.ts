export const APPOINTMENT_KINDS = ["prenatal", "ultrasound", "lab", "specialist", "class", "other"] as const;
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number];

export const KIND_LABELS: Record<AppointmentKind, string> = {
  prenatal: "Prenatal check-up",
  ultrasound: "Ultrasound / scan",
  lab: "Lab test",
  specialist: "Specialist",
  class: "Class / tour",
  other: "Other",
};

export type Appointment = {
  id: string;
  title: string;
  kind: AppointmentKind;
  scheduled_at: string;
  location: string | null;
  provider_name: string | null;
  notes: string | null;
  is_done: boolean;
};

/** One-tap presets matching the roadmap — the user only picks the date. */
export const APPOINTMENT_PRESETS: { title: string; kind: AppointmentKind; weeks: string }[] = [
  { title: "First prenatal visit", kind: "prenatal", weeks: "8–10" },
  { title: "Dating / 12-week scan", kind: "ultrasound", weeks: "11–14" },
  { title: "Anatomy scan", kind: "ultrasound", weeks: "18–22" },
  { title: "Glucose test", kind: "lab", weeks: "24–28" },
  { title: "Hospital tour", kind: "class", weeks: "28–34" },
  { title: "Group B strep test", kind: "lab", weeks: "36–38" },
];

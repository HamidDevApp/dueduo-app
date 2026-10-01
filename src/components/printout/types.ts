export type Severity = 1 | 2 | 3;

export const SEVERITY_LABELS: Record<Severity, string> = {
  1: "Mild",
  2: "Moderate",
  3: "Severe",
};

export type SymptomRow = {
  id: string;
  logged_on: string;
  symptom: string;
  severity: Severity;
  notes: string | null;
};

export type QuestionRow = {
  id: string;
  question: string;
  is_priority: boolean;
  created_by: string | null;
  created_at: string;
};

export type AppointmentRow = {
  id: string;
  title: string;
  kind: string;
  scheduled_at: string;
  location: string | null;
  provider_name: string | null;
};

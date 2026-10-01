export type QuestionRecord = {
  id: string;
  question: string;
  answer: string | null;
  is_asked: boolean;
  is_priority: boolean;
  appointment_id: string | null;
  created_by: string | null;
};

/** Upcoming appointments offered in the "For" picker. */
export type AppointmentOption = { id: string; title: string; scheduled_at: string };

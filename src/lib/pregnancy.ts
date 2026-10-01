const DAY_MS = 86_400_000;
export const PREGNANCY_DAYS = 280; // 40 weeks

export type Trimester = 1 | 2 | 3;

export type PregnancyStatus = {
  week: number;      // completed weeks (0–42)
  day: number;       // extra days (0–6)
  trimester: Trimester;
  daysToGo: number;
  progress: number;  // 0–100
};

/** Parse "YYYY-MM-DD" as a UTC calendar date (no timezone drift). */
function toUtcDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function todayUtc(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function getPregnancyStatus(dueDate: string, now = new Date()): PregnancyStatus {
  const daysToGo = Math.round((toUtcDay(dueDate) - todayUtc(now)) / DAY_MS);
  const elapsed = Math.min(Math.max(PREGNANCY_DAYS - daysToGo, 0), PREGNANCY_DAYS + 14);
  const week = Math.floor(elapsed / 7);

  return {
    week,
    day: elapsed % 7,
    trimester: week < 14 ? 1 : week < 28 ? 2 : 3,
    daysToGo: Math.max(daysToGo, 0),
    progress: Math.min(Math.round((elapsed / PREGNANCY_DAYS) * 100), 100),
  };
}

/** Naegele's rule: LMP + 280 days. Returns "YYYY-MM-DD". */
export function dueDateFromLmp(lmp: string) {
  return new Date(toUtcDay(lmp) + PREGNANCY_DAYS * DAY_MS).toISOString().slice(0, 10);
}

/* ---------- Date helpers (shared by client + server) ---------- */

/** Today as "YYYY-MM-DD" (UTC). */
export function isoToday(now = new Date()) {
  return new Date(todayUtc(now)).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  return new Date(toUtcDay(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Strict "YYYY-MM-DD" check that also rejects impossible dates (e.g. 2026-02-31). */
export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = toUtcDay(value);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === value;
}

function daysFromToday(iso: string, now = new Date()) {
  return Math.round((toUtcDay(iso) - todayUtc(now)) / DAY_MS);
}

/** Returns an error message, or null if valid. */
export function validateDueDate(value: string): string | null {
  if (!isIsoDate(value)) return "Please enter a valid due date.";
  const d = daysFromToday(value);
  if (d < -14) return "That due date is more than 2 weeks in the past.";
  if (d > PREGNANCY_DAYS) return "That due date is more than 40 weeks away — please double-check it.";
  return null;
}

/** Returns an error message, or null if valid. */
export function validateLmp(value: string): string | null {
  if (!isIsoDate(value)) return "Please enter a valid date.";
  const d = daysFromToday(value);
  if (d > 0) return "The first day of your last period can't be in the future.";
  if (d < -(PREGNANCY_DAYS + 14)) return "That date is more than 42 weeks ago — please double-check it.";
  return null;
}

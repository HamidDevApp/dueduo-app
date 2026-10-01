import { TriangleAlert } from "lucide-react";
import { URGENT_SIGNS } from "@/lib/roadmap";

export function UrgentSigns() {
  return (
    <section
      aria-labelledby="urgent-title"
      className="rounded-[var(--radius-card)] border border-brand/30 bg-brand-soft/50 p-5"
    >
      <h2 id="urgent-title" className="flex items-center gap-2 font-semibold text-brand-strong">
        <TriangleAlert className="size-5" aria-hidden /> Call your provider or emergency care if you have:
      </h2>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {URGENT_SIGNS.map((sign) => (
          <li key={sign} className="flex gap-2">
            <span aria-hidden className="text-brand">•</span>
            {sign}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Not a complete list. If something feels wrong, trust yourself and call.</p>
    </section>
  );
}

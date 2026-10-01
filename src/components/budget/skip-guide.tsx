import { ShieldAlert } from "lucide-react";
import { SECOND_HAND_TIPS, SKIP_GUIDE } from "@/lib/budget";

export function SkipGuide() {
  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {SKIP_GUIDE.map((g) => (
          <li
            key={g.item}
            className={g.unsafe ? "rounded-xl border border-brand/30 bg-brand-soft/50 p-4" : "rounded-xl bg-canvas p-4"}
          >
            <p className="flex items-center gap-1.5 font-medium">
              {g.unsafe && <ShieldAlert className="size-4 shrink-0 text-brand-strong" aria-label="Safety" />}
              {g.item}
            </p>
            <p className="mt-1 text-sm text-muted">{g.reason}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-sage-soft p-4">
        <p className="text-sm font-semibold">Buying second-hand, safely</p>
        <ul className="mt-2 space-y-1 text-sm">
          {SECOND_HAND_TIPS.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

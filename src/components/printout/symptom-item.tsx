"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSymptom } from "@/app/(app)/appointments/print/actions";
import { formatLongDate } from "@/lib/utils";
import { SEVERITY_LABELS, type SymptomRow } from "./types";

export function SymptomItem({ row }: { row: SymptomRow }) {
  const [, startTransition] = useTransition();
  const [removed, setRemoved] = useOptimistic(false);
  if (removed) return null;

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {row.symptom}{" "}
          <span className={row.severity === 3 ? "text-brand-strong" : "text-muted"}>
            · {SEVERITY_LABELS[row.severity]}
          </span>
        </p>
        <p className="text-xs text-muted">
          {formatLongDate(row.logged_on)}
          {row.notes && ` · ${row.notes}`}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Delete ${row.symptom}`}
        onClick={() =>
          startTransition(async () => {
            setRemoved(true);
            await deleteSymptom(row.id);
          })
        }
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-brand-strong"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

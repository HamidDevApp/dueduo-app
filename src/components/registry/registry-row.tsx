"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteRegistryItem, setRegistryStatus } from "@/app/(app)/registry/actions";
import { REGISTRY_STATUSES, STATUS_LABELS, type RegistryItem, type RegistryStatus } from "@/lib/registry";
import { cn, formatMoney } from "@/lib/utils";
import { RegistryForm } from "./registry-form";

const STATUS_STYLES: Record<RegistryStatus, string> = {
  wanted: "bg-canvas text-ink",
  purchased: "bg-sage-soft text-sage",
  received: "bg-sage text-white",
};

export function RegistryRow({ item, currency }: { item: RegistryItem; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useOptimistic(item.status);
  const [removed, setRemoved] = useOptimistic(false);

  if (removed) return null;

  if (editing) {
    return (
      <li className="py-4">
        <RegistryForm item={item} currency={currency} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center", pending && "opacity-70")}>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", status !== "wanted" && "text-muted")}>
          {item.name}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open link for ${item.name}`}
              className="ml-1.5 inline-flex align-middle text-brand hover:text-brand-strong"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {[item.category, item.price != null ? formatMoney(item.price, currency) : null].filter(Boolean).join(" · ") ||
            "No price yet"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <label className="sr-only" htmlFor={`status-${item.id}`}>
          Status
        </label>
        <select
          id={`status-${item.id}`}
          value={status}
          onChange={(e) =>
            startTransition(async () => {
              const next = e.target.value as RegistryStatus;
              setStatus(next);
              await setRegistryStatus(item.id, next);
            })
          }
          className={cn("rounded-full border-0 py-1.5 pr-7 pl-3 text-xs font-semibold", STATUS_STYLES[status])}
        >
          {REGISTRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink">
          <Pencil className="size-4" />
        </button>
        {confirmDelete ? (
          <button
            type="button"
            onBlur={() => setConfirmDelete(false)}
            onClick={() =>
              startTransition(async () => {
                setRemoved(true);
                await deleteRegistryItem(item.id);
              })
            }
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"
          >
            Delete?
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${item.name}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-brand-strong">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

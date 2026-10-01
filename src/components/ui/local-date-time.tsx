"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/utils";

const subscribe = () => () => {};

/**
 * Renders a timestamp in the viewer's own timezone.
 * The server (UTC on Vercel) renders a UTC fallback; the browser swaps in local time after hydration.
 */
export function LocalDateTime({ iso, className }: { iso: string; className?: string }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <time dateTime={iso} className={className}>
      {isClient ? formatDateTime(iso) : `${formatDateTime(iso, "UTC")} UTC`}
    </time>
  );
}

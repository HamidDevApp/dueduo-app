"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-runs the server page every few seconds (used while a payment is still processing). */
export function AutoRefresh({ everyMs = 3000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}

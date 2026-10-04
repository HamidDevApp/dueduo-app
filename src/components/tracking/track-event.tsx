"use client";

import { useEffect } from "react";
import { track, type TrackEvent as EventName } from "@/lib/track";

type Props = { event: EventName; eventId?: string; value?: number; currency?: string };

/** Fires one ad event when the page renders (once per event ID per browser tab). */
export function TrackEvent({ event, eventId, value, currency }: Props) {
  useEffect(() => {
    const key = `dd_tracked_${event}_${eventId ?? location.pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable — still track */
    }
    track(event, { eventId, value, currency });
  }, [event, eventId, value, currency]);
  return null;
}

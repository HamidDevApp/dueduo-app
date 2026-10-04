"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { CONSENT_EVENT, CONSENT_OPEN_EVENT, readConsent, writeConsent } from "@/lib/consent";

const HAS_PIXELS = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);

function subscribe(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  return () => window.removeEventListener(CONSENT_EVENT, cb);
}

function subscribeOpen(cb: () => void) {
  window.addEventListener(CONSENT_OPEN_EVENT, cb);
  return () => window.removeEventListener(CONSENT_OPEN_EVENT, cb);
}

let openCount = 0;
const getOpenCount = () => openCount;
if (typeof window !== "undefined") window.addEventListener(CONSENT_OPEN_EVENT, () => (openCount += 1));

/** Shown until the visitor chooses. Only appears when an ad pixel is configured. */
export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribe, readConsent, () => "pending" as const);
  const opened = useSyncExternalStore(subscribeOpen, getOpenCount, () => 0);
  const [dismissedAt, setDismissedAt] = useState(0);

  const reopened = opened > dismissedAt;
  if (!HAS_PIXELS || consent === "pending" || (consent && !reopened)) return null;

  const choose = (value: "granted" | "denied") => {
    writeConsent(value);
    setDismissedAt(opened);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-ink/10 bg-white p-5 shadow-2xl sm:bottom-5 print:hidden"
    >
      <p className="text-sm leading-relaxed text-ink">
        We use cookies from Meta and TikTok to measure our ads — <strong>only if you agree</strong>. Essential cookies that
        keep you signed in are always on.{" "}
        <Link href="/privacy#cookies" className="font-semibold text-brand-strong underline-offset-2 hover:underline">
          Learn more
        </Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => choose("granted")}
          className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-ink/90"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          className="flex-1 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold hover:bg-canvas"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

/** Footer link to reopen the banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className={className}>
      Cookie settings
    </button>
  );
}

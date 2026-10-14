"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { SITE } from "@/lib/site-config";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Cloudflare's always-pass test key, so the widget also works on localhost / previews. */
const TEST_SITE_KEY = "1x00000000000000000000AA";
const siteKey = () => (window.location.hostname.endsWith(SITE.domain) ? SITE.turnstileSiteKey : TEST_SITE_KEY);

/**
 * Bot check for the login form. Supabase Auth verifies the token (Attack Protection → CAPTCHA),
 * so bots can't skip the form and request login emails directly.
 * Tokens are single-use: bump `resetKey` after every attempt to get a fresh one.
 */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  function mount() {
    if (!box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey(),
      appearance: "interaction-only",
      callback: (t: string) => onTokenRef.current(t),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }

  useEffect(() => {
    mount();
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && widget.current) {
      onTokenRef.current(null);
      window.turnstile?.reset(widget.current);
    }
  }, [resetKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={mount} />
      <div ref={box} className="flex justify-center empty:hidden" />
    </>
  );
}

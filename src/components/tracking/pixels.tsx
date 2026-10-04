"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";
import { flushTrackQueue } from "@/lib/track";

const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

function subscribe(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  return () => window.removeEventListener(CONSENT_EVENT, cb);
}

/* Official base snippets, adapted to load on demand (only after consent). */
/* eslint-disable @typescript-eslint/no-explicit-any, prefer-rest-params */
function loadMeta(id: string) {
  const w = window as any;
  if (w.fbq) return;
  const n: any = (w.fbq = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  });
  if (!w._fbq) w._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  w.fbq("init", id);
}

function loadTikTok(id: string) {
  const w = window as any;
  if (w.ttq) return;
  w.TiktokAnalyticsObject = "ttq";
  const ttq: any = (w.ttq = []);
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = (t: any, e: string) => {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq.instance = (t: string) => {
    const e = ttq._i[t] || [];
    for (const m of ttq.methods) ttq.setAndDefer(e, m);
    return e;
  };
  ttq.load = (e: string, n?: any) => {
    const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = `${r}?sdkid=${e}&lib=ttq`;
    document.head.appendChild(s);
  };
  ttq.load(id);
}
/* eslint-enable @typescript-eslint/no-explicit-any, prefer-rest-params */

/** Keeps ad click IDs (from the landing URL) so server-side events can be matched. */
function rememberClickIds() {
  const params = new URLSearchParams(location.search);
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const fbclid = params.get("fbclid");
  if (fbclid && !document.cookie.includes("_fbc=")) {
    document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; Max-Age=7776000; Path=/; SameSite=Lax${secure}`;
  }
  const ttclid = params.get("ttclid");
  if (ttclid) document.cookie = `dd_ttclid=${ttclid}; Max-Age=2592000; Path=/; SameSite=Lax${secure}`;
}

/** Loads Meta + TikTok pixels only after the visitor accepts cookies, and tracks page views. */
export function Pixels() {
  const consent = useSyncExternalStore(subscribe, readConsent, () => null);
  const pathname = usePathname();
  const enabled = consent === "granted" && Boolean(META_ID || TIKTOK_ID);

  useEffect(() => {
    if (!enabled) {
      if (consent === "denied") {
        window.fbq?.("consent", "revoke");
        window.ttq?.revokeConsent?.();
        window.__ddPixelsReady = false;
      }
      return;
    }
    if (!window.__ddPixelsReady) {
      if (META_ID) loadMeta(META_ID);
      if (TIKTOK_ID) loadTikTok(TIKTOK_ID);
      window.fbq?.("consent", "grant");
      rememberClickIds();
      window.__ddPixelsReady = true;
      flushTrackQueue();
    }
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  }, [enabled, consent, pathname]);

  return null;
}

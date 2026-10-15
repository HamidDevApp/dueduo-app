"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 30-second product tour in the homepage hero. Self-hosted, muted, no tracking.
 * Autoplays on loop; with "reduce motion" on, it stays paused and shows controls instead.
 */
export function HeroDemo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReducedMotion(mq.matches);
      const v = ref.current;
      if (!v) return;
      if (mq.matches) v.pause();
      else v.play().catch(() => {});
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <figure className="mx-auto w-[min(260px,80vw)] lg:w-[300px]">
      <div className="overflow-hidden rounded-3xl bg-canvas shadow-2xl shadow-ink/15 ring-1 ring-ink/5">
        <video
          ref={ref}
          className="block aspect-[9/16] h-auto w-full bg-canvas"
          width={720}
          height={1280}
          src="/demo/dueduo-demo.mp4"
          poster="/demo/dueduo-demo-poster.jpg"
          muted
          loop
          playsInline
          autoPlay={!reducedMotion}
          controls={reducedMotion}
          preload="metadata"
          aria-label="30-second tour of the DueDuo app"
        />
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">
        A 30-second tour. Example plan with sample names.
      </figcaption>
    </figure>
  );
}

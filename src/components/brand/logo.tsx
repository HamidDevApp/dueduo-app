import { cn } from "@/lib/utils";

/** DueDuo mark: two overlapping circles — two people, one plan. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-brand-strong" />
      <circle cx="12.5" cy="16" r="6.5" fill="none" stroke="#fff" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="6.5" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="2.4" />
    </svg>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-display text-xl font-semibold tracking-tight">
          Due<span className="text-brand-strong">Duo</span>
        </span>
        {subtitle && (
          <span className="block text-[11px] font-medium tracking-wide text-muted uppercase">{subtitle}</span>
        )}
      </span>
    </span>
  );
}

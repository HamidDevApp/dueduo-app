import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Primary CTA: sign up (magic link) → straight to checkout. */
export const CHECKOUT_PATH = "/login?next=/checkout";

export function CtaLink({ children, className, variant = "primary" }: { children: React.ReactNode; className?: string; variant?: "primary" | "light" }) {
  return (
    <Link
      href={CHECKOUT_PATH}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-colors",
        variant === "primary" ? "bg-brand text-white shadow-sm hover:bg-brand-strong" : "bg-white text-brand-strong hover:bg-brand-soft",
        className,
      )}
    >
      {children} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

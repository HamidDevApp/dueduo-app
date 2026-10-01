import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Primary conversion path: magic-link sign-up → straight to Stripe checkout. */
export const CHECKOUT_PATH = "/login?next=/checkout";

type Variant = "primary" | "dark" | "light";

const STYLES: Record<Variant, string> = {
  // brand-strong on white text passes WCAG AA contrast
  primary: "bg-brand-strong text-white shadow-lg shadow-brand-strong/20 hover:bg-[#8f423d]",
  dark: "bg-ink text-canvas shadow-lg shadow-ink/15 hover:bg-ink/90",
  light: "bg-white text-ink shadow-lg shadow-black/10 hover:bg-canvas",
};

export function CtaLink({
  children,
  className,
  variant = "primary",
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={CHECKOUT_PATH}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong",
        size === "lg" ? "px-7 py-4 text-base" : "px-5 py-2.5 text-sm",
        STYLES[variant],
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

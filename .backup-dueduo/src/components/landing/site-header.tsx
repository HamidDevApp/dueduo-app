import Link from "next/link";
import { Baby } from "lucide-react";
import { SITE } from "@/lib/site-config";
import { CHECKOUT_PATH } from "./cta-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label={SITE.name}>
          <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
            <Baby className="size-4.5" aria-hidden />
          </span>
          <span className="hidden font-display text-lg whitespace-nowrap min-[420px]:inline">{SITE.name}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap">
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
            What&apos;s inside
          </a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
            Pricing
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 text-muted hover:text-ink">
            Log in
          </Link>
          <Link href={CHECKOUT_PATH} className="rounded-lg bg-ink px-3.5 py-2 text-canvas hover:bg-ink/90">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CHECKOUT_PATH } from "./cta-link";

const LINKS = [
  { href: "/#co-pilot", label: "Co-Pilot" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="DueDuo home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-muted transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
          <Link href="/login" className="rounded-full px-3.5 py-2 text-muted transition-colors hover:text-ink">
            Log in
          </Link>
          <Link
            href={CHECKOUT_PATH}
            className="rounded-full bg-ink px-4 py-2 text-canvas transition-colors hover:bg-ink/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

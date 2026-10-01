"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <Baby className="size-5" aria-hidden />
        </span>
        <span className="font-display text-lg leading-tight">
          First Pregnancy
          <span className="block text-xs font-sans font-medium tracking-wide text-muted uppercase">
            Command Center
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="px-6 py-5 text-xs leading-relaxed text-muted">
        Not medical advice. Always follow your doctor or midwife.
      </p>
    </aside>
  );
}

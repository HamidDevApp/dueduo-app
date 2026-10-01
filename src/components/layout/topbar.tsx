import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import type { PregnancyStatus } from "@/lib/pregnancy";

type Props = {
  name: string | null;
  status: PregnancyStatus | null;
};

export function Topbar({ name, status }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">
            Hi{name ? `, ${name.split(" ")[0]}` : ""} 👋
          </p>
          {status && (
            <p className="text-sm font-semibold">
              Week {status.week}
              {status.day > 0 && <span className="font-normal text-muted"> + {status.day}d</span>}
              <span className="mx-2 text-line">|</span>
              <span className="font-normal text-muted">Trimester {status.trimester}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-ink lg:hidden"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

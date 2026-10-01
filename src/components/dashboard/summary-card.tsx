import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

type Props = {
  href: string;
  title: string;
  icon: LucideIcon;
  value: string;
  hint: React.ReactNode;
  progress?: number;
  cta?: string;
};

export function SummaryCard({ href, title, icon: Icon, value, hint, progress, cta = "Open" }: Props) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2.5 text-sm font-medium text-muted">
        <span className="grid size-8 place-items-center rounded-lg bg-canvas text-brand">
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </div>

      <p className="mt-4 font-display text-2xl leading-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>

      {progress !== undefined && (
        <ProgressBar value={progress} label={`${title} progress`} tone="sage" className="mt-4" />
      )}

      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {cta} <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}

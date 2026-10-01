import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0–100
  label: string; // accessible name
  tone?: "brand" | "sage";
  className?: string;
};

export function ProgressBar({ value, label, tone = "brand", className }: Props) {
  const pct = Math.min(Math.max(Math.round(value), 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-canvas", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "brand" ? "bg-brand" : "bg-sage",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

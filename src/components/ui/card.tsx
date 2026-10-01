import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(43_35_32/0.04)]",
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";
import type { CountBadgeProps } from "@/types/appShell";

/** Red count on the Messages and Notifications buttons; shows 9+ above nine. */
export function CountBadge({ count, className }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="count-badge"
      className={cn(
        "absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 px-[5px]",
        "border-[var(--shell-badge-ring)] bg-[var(--shell-badge)] text-[10.5px] leading-none font-extrabold text-[var(--shell-badge-ink)]",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

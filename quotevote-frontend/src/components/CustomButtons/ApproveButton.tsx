"use client";

import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApproveButtonProps } from "@/types/components";
import { POST_ACTION_NEUTRAL_CLASS, POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { cn } from "@/lib/utils";

/**
 * ApproveButton Component
 *
 * Whole-post approve control. Selected state is filled; unselected is outlined.
 */
export function ApproveButton({
  selected = false,
  count = 0,
  className,
  ...props
}: ApproveButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={selected}
      className={cn(
        POST_ACTION_PILL_CLASS,
        "gap-2 shrink-0",
        selected
          ? "border-[var(--shell-primary-line)] bg-[var(--shell-primary)] text-[var(--shell-primary-ink)] hover:bg-[var(--shell-primary-hover)] hover:text-[var(--shell-primary-ink)]"
          : cn(POST_ACTION_NEUTRAL_CLASS, "text-[var(--shell-green)] hover:text-[var(--shell-green)]"),
        className
      )}
      {...props}
    >
      <ThumbsUp className="size-4" fill="currentColor" strokeWidth={1.5} />
      Approve
      <span className="tabular-nums font-bold">{count}</span>
    </Button>
  );
}

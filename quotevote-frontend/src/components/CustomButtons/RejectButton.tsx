"use client";

import { ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RejectButtonProps } from "@/types/components";
import { POST_ACTION_NEUTRAL_CLASS, POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { cn } from "@/lib/utils";

/**
 * RejectButton Component
 *
 * Whole-post reject control. Selected state is filled; unselected is outlined.
 */
export function RejectButton({
  selected = false,
  count = 0,
  className,
  ...props
}: RejectButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={selected}
      // Phones hide the word, so the button always carries its own name.
      aria-label={`Reject, ${count}`}
      className={cn(
        POST_ACTION_PILL_CLASS,
        "gap-2 shrink-0",
        selected
          ? "border-[#c42b2b] bg-[#c42b2b] text-white hover:bg-[#a82424] hover:text-white [.neo-brutalism_&]:border-[var(--shell-line)] [.neo-brutalism_&]:bg-[#ff646f] [.neo-brutalism_&]:text-[#070b14]"
          : cn(POST_ACTION_NEUTRAL_CLASS, "text-[var(--shell-down)] hover:text-[var(--shell-down)]"),
        className
      )}
      {...props}
    >
      <ThumbsDown className="size-4" fill="currentColor" strokeWidth={1.5} />
      {/* Phones show just the count, as in the design. */}
      <span className="hidden sm:inline">Reject</span>
      <span className="tabular-nums font-bold">{count}</span>
    </Button>
  );
}

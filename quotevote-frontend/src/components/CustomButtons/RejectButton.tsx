"use client";

import { ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RejectButtonProps } from "@/types/components";
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
      className={cn(
        "h-8 rounded-full px-2.5 text-xs font-semibold border shadow-none gap-1 shrink-0",
        selected
          ? "bg-[#f87171] border-[#f87171] text-white hover:bg-[#ef4444] hover:text-white"
          : "bg-[#fdecec] border-[#f5b7b7] text-[#e85d5d] hover:bg-[#f9dede] hover:text-[#d94848]",
        className
      )}
      {...props}
    >
      <ThumbsDown className="size-4" fill="currentColor" strokeWidth={1.5} />
      Reject
      <span className="tabular-nums font-bold">{count}</span>
    </Button>
  );
}

"use client";

import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApproveButtonProps } from "@/types/components";
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
        "h-8 rounded-full px-2.5 text-xs font-semibold border shadow-none gap-1 shrink-0",
        selected
          ? "bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#16a34a] hover:text-white"
          : "bg-[#e9f8ef] border-[#b6e4c6] text-[#2f9e57] hover:bg-[#dff4e7] hover:text-[#278a4b]",
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

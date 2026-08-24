"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clampQuoteRatio,
  loadPersistedQuoteRatio,
  persistQuoteRatio,
  shouldCollapseOpenSplit,
  snapQuoteRatio,
} from "@/lib/utils/discussionSplit";
import { DEFAULT_QUOTE_RATIO, DISCUSSION_BAR_HEIGHT_PX } from "@/types/discussionSplit";
import type { MobileDiscussionSplitProps } from "@/types/discussionSplit";

function subscribeSplitRatio(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

/**
 * Mobile Quote page split-screen: collapsed discussion bar, or a vertically
 * resizable Quote / Discussion pair with snap points.
 */
export default function MobileDiscussionSplit({
  open,
  onOpenChange,
  discussionCount,
  quotePane,
  children,
}: MobileDiscussionSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartRatio = useRef(DEFAULT_QUOTE_RATIO);
  const draggingRef = useRef(false);

  const persistedRatio = useSyncExternalStore(
    subscribeSplitRatio,
    loadPersistedQuoteRatio,
    () => DEFAULT_QUOTE_RATIO
  );
  const [overrideRatio, setOverrideRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const quoteRatio = overrideRatio ?? persistedRatio;
  const quoteRatioRef = useRef(quoteRatio);
  useEffect(() => {
    quoteRatioRef.current = quoteRatio;
  }, [quoteRatio]);

  const restoreDefaultRatio = useCallback(() => {
    persistQuoteRatio(DEFAULT_QUOTE_RATIO);
    setOverrideRatio(DEFAULT_QUOTE_RATIO);
  }, []);

  const handleCollapse = useCallback(() => {
    restoreDefaultRatio();
    onOpenChange(false);
  }, [onOpenChange, restoreDefaultRatio]);

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const ratio = quoteRatioRef.current;
    if (shouldCollapseOpenSplit(ratio)) {
      restoreDefaultRatio();
      onOpenChange(false);
      return;
    }
    const snapped = snapQuoteRatio(ratio);
    persistQuoteRatio(snapped);
    setOverrideRatio(snapped);
  }, [onOpenChange, restoreDefaultRatio]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCollapse();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCollapse, open]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!open) return;
      draggingRef.current = true;
      dragStartY.current = e.clientY;
      dragStartRatio.current = quoteRatioRef.current;
      setIsDragging(true);
      if (typeof e.currentTarget.setPointerCapture === "function") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [open]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !containerRef.current) return;
    const height = containerRef.current.clientHeight;
    if (height <= 0) return;
    const deltaY = e.clientY - dragStartY.current;
    const next = clampQuoteRatio(dragStartRatio.current + deltaY / height);
    quoteRatioRef.current = next;
    setOverrideRatio(next);
  }, []);

  const handlePointerUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const title = `Discussion · ${discussionCount}`;
  const quotePercent = Math.round(quoteRatio * 100);
  const discussionPercent = 100 - quotePercent;

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden relative"
      data-testid={open ? "discussion-split-view" : "discussion-reading-view"}
    >
      <div
        data-post-detail-pane="content"
        className={cn(
          "min-h-0 overflow-y-auto overscroll-contain",
          open ? "shrink-0" : "flex-1",
          open && !isDragging && "transition-[height] duration-200 ease-out"
        )}
        style={open ? { height: `${quotePercent}%` } : undefined}
      >
        {quotePane}
      </div>

      <div
        data-post-detail-pane="discussion"
        data-testid="discussion-pane"
        className={cn(
          "flex min-h-0 flex-col overflow-hidden bg-card",
          open ? "border-t border-border rounded-t-2xl" : "hidden",
          open && !isDragging && "transition-[height] duration-200 ease-out"
        )}
        style={open ? { height: `${discussionPercent}%` } : undefined}
        hidden={!open}
      >
        <div
          data-discussion-header
          data-testid="discussion-resize-handle"
          className="flex shrink-0 cursor-row-resize touch-none select-none flex-col bg-card border-b border-border/60"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={quotePercent}
            aria-label="Resize quote and discussion panes"
            data-testid="discussion-divider"
            className="flex flex-col items-center"
          >
            <div className="mt-1 w-10 h-1 rounded-full bg-muted-foreground/30 [.neo-brutalism_&]:mt-0" />
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <button
              type="button"
              className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"
              aria-label="Collapse discussion"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleCollapse}
            >
              <ChevronUp className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      {!open ? (
        <button
          type="button"
          data-testid="discussion-collapsed-bar"
          aria-expanded={false}
          aria-label={`Open discussion, ${discussionCount} items`}
          onClick={() => onOpenChange(true)}
          className={cn(
            "flex shrink-0 flex-col items-center justify-center bg-card border-t border-border rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
            "w-full text-left"
          )}
          style={{ height: DISCUSSION_BAR_HEIGHT_PX }}
        >
          {/* Hidden spacer so the collapsed bar stays 56px without looking draggable. */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mt-1.5 mb-1 opacity-0" />
          <div className="flex w-full items-center gap-2 px-4 pb-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <ChevronDown className="ml-auto size-4 text-muted-foreground" />
          </div>
        </button>
      ) : null}
    </div>
  );
}

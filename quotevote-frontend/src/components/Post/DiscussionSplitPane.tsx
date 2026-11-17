"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@/lib/utils";
import {
  clampContentRatio,
  getContentRatioBounds,
  loadPersistedContentRatio,
  persistContentRatio,
} from "@/lib/utils/discussionSplit";
import { DEFAULT_CONTENT_RATIO, SPLIT_KEYBOARD_STEP } from "@/types/discussionSplit";
import type { DiscussionSplitPaneProps } from "@/types/discussionSplit";

/** A click or tap on the divider (no drag) steps through these sizes. */
const CLICK_PRESETS = [0.5, 0.65, 0.35] as const;
/** Movement under this many pixels counts as a click, not a drag. */
const DRAG_THRESHOLD_PX = 4;

/**
 * Post and Discussion side by side with a draggable divider (#516). Starts at
 * half and half, keeps both panes at least MIN_SPLIT_PANE_WIDTH_PX wide, and
 * remembers the last size. Works with mouse, trackpad, touch and keyboard, and
 * a click on the divider steps through preset sizes for anyone who can't drag.
 */
export default function DiscussionSplitPane({
  contentPane,
  children,
  className,
}: DiscussionSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const [ratio, setRatio] = useState<number>(loadPersistedContentRatio);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startRatio: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bounds = getContentRatioBounds(width);
  const shown = width > 0 ? clampContentRatio(ratio, bounds) : ratio;
  const percent = Math.round(shown * 100);

  const commit = useCallback(
    (next: number) => {
      const clamped = clampContentRatio(next, bounds);
      setRatio(clamped);
      persistContentRatio(clamped);
    },
    [bounds]
  );

  // While dragging, keep the resize cursor and stop text selection page-wide.
  useEffect(() => {
    if (!dragging) return undefined;
    const { cursor, userSelect } = document.body.style;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [dragging]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    drag.current = { startX: event.clientX, startRatio: shown, moved: false };
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || width <= 0) return;
    const dx = event.clientX - state.startX;
    if (!state.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    if (!state.moved) {
      state.moved = true;
      setDragging(true);
    }
    setRatio(clampContentRatio(state.startRatio + dx / width, bounds));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    setDragging(false);
    if (state.moved) {
      persistContentRatio(clampContentRatio(ratio, bounds));
      return;
    }
    if (event.type === "pointercancel") return;
    // A click: go to the next preset after the one closest to the current size.
    const nearest = CLICK_PRESETS.reduce(
      (best, preset, i) =>
        Math.abs(preset - shown) < Math.abs(CLICK_PRESETS[best] - shown) ? i : best,
      0
    );
    commit(CLICK_PRESETS[(nearest + 1) % CLICK_PRESETS.length]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? SPLIT_KEYBOARD_STEP * 2 : SPLIT_KEYBOARD_STEP;
    let next: number | null = null;
    if (event.key === "ArrowLeft") next = shown - step;
    else if (event.key === "ArrowRight") next = shown + step;
    else if (event.key === "Home") next = bounds.min;
    else if (event.key === "End") next = bounds.max;
    else if (event.key === "Enter") next = DEFAULT_CONTENT_RATIO;
    if (next === null) return;
    event.preventDefault();
    commit(next);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex overflow-hidden", className)}
      data-testid="discussion-split"
      data-dragging={dragging ? "true" : undefined}
    >
      <div
        id={contentId}
        data-post-detail-pane="content"
        className="min-w-0 shrink-0 overflow-y-auto bg-[var(--shell-surface)]"
        style={{ width: `${shown * 100}%` }}
      >
        {contentPane}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-controls={contentId}
        aria-label="Resize post and discussion"
        aria-valuemin={Math.round(bounds.min * 100)}
        aria-valuemax={Math.round(bounds.max * 100)}
        aria-valuenow={percent}
        aria-valuetext={`Post ${percent}%, discussion ${100 - percent}%`}
        title="Drag to resize, or click to switch sizes"
        data-testid="discussion-split-divider"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        className="group relative z-10 -mx-3 flex w-6 shrink-0 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-[#52b274] group-focus-visible:bg-[#52b274]",
            dragging && "w-0.5 bg-[#2f7a4c]"
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-12 w-3.5 flex-col items-center justify-center gap-1 rounded-full border border-[#8a8a93] bg-background shadow-sm transition-colors group-hover:border-[#2f7a4c] group-focus-visible:border-[#2f7a4c] group-focus-visible:ring-2 group-focus-visible:ring-[#52b274] dark:border-[#6e7681] dark:group-hover:border-[#7fdc9c]",
            dragging && "border-[#2f7a4c] dark:border-[#7fdc9c]"
          )}
        >
          <span className="size-1 rounded-full bg-foreground/60" />
          <span className="size-1 rounded-full bg-foreground/60" />
          <span className="size-1 rounded-full bg-foreground/60" />
        </span>
      </div>

      <div
        data-post-detail-pane="discussion"
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

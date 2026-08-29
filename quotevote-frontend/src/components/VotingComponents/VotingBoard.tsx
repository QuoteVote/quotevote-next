"use client";

import { Fragment, useState, useCallback, useLayoutEffect, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import Highlighter from "react-highlight-words";
import { parseDomSelection } from "@/lib/utils/parserDom";
import { cn } from "@/lib/utils";
import { scrollLinkedPassageIntoView } from "@/lib/utils/discussionSplit";
import SelectionPopover from "./SelectionPopover";
import type { VotingBoardProps, SelectedText, SelectionPhase } from "@/types/voting";

const LINKED_PASSAGE_CLASS =
  "bg-[#52b274]/20 text-foreground rounded-sm box-decoration-clone cursor-pointer px-0.5";

const RETAINED_PASSAGE_CLASS =
  "bg-[#52b274]/20 text-foreground rounded-sm box-decoration-clone px-0.5";

const TOUCH_MEDIA_QUERY = "(hover: none) and (pointer: coarse)";

/**
 * Stable highlight tag so Highlighter does not remount on parent re-renders.
 * Clicks bubble to the passage container, which owns the reverse-nav handler.
 */
function LinkedPassageMark({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
  highlightIndex?: number;
}) {
  return (
    <mark
      data-linked-passage="true"
      data-testid="linked-passage"
      className={cn(className, LINKED_PASSAGE_CLASS)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {children}
    </mark>
  );
}

/**
 * Retained passage mark (issue #484): plain semantic <mark>, no button
 * semantics — the text stays in the accessibility tree.
 */
function RetainedPassageMark({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
  highlightIndex?: number;
}) {
  return (
    <mark
      data-testid="retained-selection-highlight"
      className={cn(className, RETAINED_PASSAGE_CLASS)}
    >
      {children}
    </mark>
  );
}

function isCoarseTouchEnvironment(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(TOUCH_MEDIA_QUERY).matches;
}

function isDialogTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest('dialog[open], [role="dialog"], [role="alertdialog"]');
}

/**
 * VotingBoard — explicit selection state machine for issue #484.
 * Touch-first devices use the delayed (two-tap) workflow; desktop opens
 * the toolbar immediately from the live selection and never renders the
 * retained mark nor installs outside-tap suppression.
 */
export default function VotingBoard({
  topOffset,
  onSelect,
  onDeselect,
  highlights = false,
  content,
  children,
  votes = [],
  style,
  focusedComment,
  onHighlightClick,
}: VotingBoardProps) {
  void votes;
  const [phase, setPhase] = useState<SelectionPhase>("idle");
  const phaseRef = useRef<SelectionPhase>("idle");
  const [selection, setSelection] = useState<SelectedText>({
    startIndex: 0,
    endIndex: 0,
    text: "",
    points: 0,
  });

  /**
   * Touch mode captured at the moment a selection becomes valid.
   * Gates ALL retained-mobile behavior so desktop never renders the retained
   * mark, never installs outside-tap suppression, and keeps its legacy
   * selection-driven dismissal (P1 #1).
   */
  const [touchMode, setTouchMode] = useState(false);
  const touchModeRef = useRef(false);

  // Retained toolbar anchor: cached native rect for immediate positioning after flushSync
  const cachedRectRef = useRef<DOMRect | null>(null);
  const cachedSelectionRef = useRef<SelectedText | null>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const selectableRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Click suppression — mounted listener with pointerId + deadline (refinement 5)
  const suppressNextClickRef = useRef(false);
  const suppressPointerIdRef = useRef<number | null>(null);
  const suppressDeadlineRef = useRef<number>(0);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tap-vs-drag discrimination for taps inside selectable content (P1 #2)
  const pendingTapRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const tapDraggedRef = useRef(false);

  const setPhaseSynced = useCallback((next: SelectionPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearSuppress = useCallback(() => {
    suppressNextClickRef.current = false;
    suppressPointerIdRef.current = null;
    suppressDeadlineRef.current = 0;
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = null;
    }
  }, []);

  const armSuppress = useCallback(
    (pointerId: number | null) => {
      suppressNextClickRef.current = true;
      suppressPointerIdRef.current = pointerId;
      suppressDeadlineRef.current = Date.now() + 750;
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = setTimeout(clearSuppress, 800);
    },
    [clearSuppress]
  );

  const clearNativeSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
  }, []);

  const resetToIdle = useCallback(() => {
    cachedRectRef.current = null;
    cachedSelectionRef.current = null;
    touchModeRef.current = false;
    setTouchMode(false);
    pendingTapRef.current = null;
    setSelection({ startIndex: 0, endIndex: 0, text: "", points: 0 });
    setPhaseSynced("idle");
    onDeselect?.();
  }, [onDeselect, setPhaseSynced]);

  const commentData = focusedComment || null;
  const startWordIndex = commentData?.startWordIndex ?? 0;
  const endWordIndex = commentData?.endWordIndex ?? 0;
  const highlightedText = content
    .substring(startWordIndex, endWordIndex)
    .replace(/(\r\n|\n|\r)/gm, "");
  const hasLinkedRange = endWordIndex > startWordIndex;

  /**
   * Retained rendering is gated on the captured touch-mode flag (P1 #1):
   * desktop reaches 'toolbar' phase too, but never renders the mark.
   */
  const hasValidRetainedSelection =
    phase === "toolbar" &&
    touchMode &&
    cachedSelectionRef.current != null &&
    cachedSelectionRef.current.endIndex > cachedSelectionRef.current.startIndex &&
    cachedSelectionRef.current.text.length > 0;

  useLayoutEffect(() => {
    if (!hasLinkedRange) return;
    // Retained highlight takes precedence while toolbar open; don't auto-scroll linked
    if (phase === "toolbar" && hasValidRetainedSelection) return;
    const frame = window.requestAnimationFrame(() => {
      scrollLinkedPassageIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    hasLinkedRange,
    commentData?.actionId,
    startWordIndex,
    endWordIndex,
    phase,
    hasValidRetainedSelection,
  ]);

  // Content change resets state (skip initial mount)
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (prevContentRef.current === content) return;
    prevContentRef.current = content;
    resetToIdle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(TOUCH_MEDIA_QUERY);
    const handler = () => {
      // Input-mode change resets state and removes stale listeners/timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearSuppress();
      cachedRectRef.current = null;
      cachedSelectionRef.current = null;
      touchModeRef.current = false;
      setTouchMode(false);
      setSelection({ startIndex: 0, endIndex: 0, text: "", points: 0 });
      setPhaseSynced("idle");
      onDeselect?.();
    };
    // Modern browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Safari fallback
    const legacy = mql as unknown as {
      addListener: (cb: () => void) => void;
      removeListener: (cb: () => void) => void;
    };
    if (legacy.addListener) {
      legacy.addListener(handler);
      return () => legacy.removeListener(handler);
    }
    return undefined;
  }, [clearSuppress, onDeselect, setPhaseSynced]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    };
  }, []);

  const tryParseSelection = useCallback(
    (sel: Selection): { parsed: SelectedText; rect: DOMRect } | null => {
      const text = sel.toString();
      if (!text) return null;
      if (sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return null;
      const root = contentRef.current;
      if (!root) return null;
      if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
      let rect: DOMRect;
      try {
        rect = range.getBoundingClientRect();
      } catch {
        return null;
      }
      if (rect.width <= 0 || rect.height <= 0) return null;

      // DOM-aware parser only (P2 #2): no legacy indexOf fallback —
      // rejecting the selection is safer than binding the wrong passage.
      const domParsed = parseDomSelection({
        content,
        selectedText: text,
        range,
        contentRoot: root,
      });
      if (
        !domParsed ||
        typeof domParsed.startIndex !== "number" ||
        typeof domParsed.endIndex !== "number"
      ) {
        return null;
      }
      const startIndex = domParsed.startIndex;
      const endIndex = domParsed.endIndex;
      if (startIndex < 0 || endIndex > content.length || endIndex <= startIndex) {
        return null;
      }
      // Final verification: normalized slice must match normalized selection
      const slice = content.slice(startIndex, endIndex);
      const normSlice = slice.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const normText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (normSlice !== normText) return null;
      return {
        parsed: {
          startIndex,
          endIndex,
          text: slice,
          points: endIndex - startIndex,
        },
        rect,
      };
    },
    [content]
  );

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    const collapsedOrEmpty = !sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed;
    if (collapsedOrEmpty) {
      // Refinement 2: collapsed with no cached passage → idle; with cached passage → ignore
      if (phaseRef.current === "native") {
        if (!cachedSelectionRef.current) resetToIdle();
        return;
      }
      // Desktop toolbar: selection cleared (click elsewhere) → dismiss.
      // Retained (touch) toolbar clears the native selection deliberately
      // during the transition, so it must NOT reset here.
      if (phaseRef.current === "toolbar" && !touchModeRef.current) {
        resetToIdle();
      }
      return;
    }
    const result = tryParseSelection(sel!);
    if (!result) {
      if (phaseRef.current === "native" && cachedSelectionRef.current) return;
      return;
    }
    const { parsed, rect } = result;
    cachedSelectionRef.current = parsed;
    cachedRectRef.current = rect;
    setSelection(parsed);

    // Capture input mode at the moment the selection becomes valid (P1 #1)
    const delayed = isCoarseTouchEnvironment();
    touchModeRef.current = delayed;
    setTouchMode(delayed);
    if (delayed) {
      // Touch-first: store but keep toolbar hidden (native menu active)
      setPhaseSynced("native");
      // Don't call onSelect yet; toolbar not shown
    } else {
      // Desktop: open immediately, live selection drives rendering/positioning
      setPhaseSynced("toolbar");
      onSelect?.(parsed);
    }
  }, [tryParseSelection, resetToIdle, setPhaseSynced, onSelect]);

  // Selection ownership scoped to local selectable-content ref + polling fallback
  useEffect(() => {
    const target = selectableRef.current;
    if (!target) return;

    const onSelectStart = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        // Polling fallback for mobile handle drag; also observe selectionchange in native
        handleSelectionChange();
      }, 100);
    };
    const onPointerUp = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Let selection settle then refresh
      window.setTimeout(handleSelectionChange, 0);
    };

    target.addEventListener("selectstart", onSelectStart);
    target.addEventListener("pointerup", onPointerUp);
    // While in native, selectionchange from handle drag should refresh;
    // desktop selectionchange drives both open (idle→toolbar) and dismissal
    // (toolbar→idle when the selection collapses). Retained toolbar ignores
    // it because the native selection was deliberately cleared.
    const onDocSelectionChange = () => {
      if (phaseRef.current === "native") handleSelectionChange();
      else if (phaseRef.current === "idle" && !isCoarseTouchEnvironment()) handleSelectionChange();
      else if (phaseRef.current === "toolbar" && !touchModeRef.current) handleSelectionChange();
    };
    document.addEventListener("selectionchange", onDocSelectionChange);

    return () => {
      target.removeEventListener("selectstart", onSelectStart);
      target.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("selectionchange", onDocSelectionChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [handleSelectionChange]);

  /**
   * Perform the native → toolbar transition (first tap).
   * Ordering (refinement 1): cache rect → phase → flushSync mark → clear
   * native → position. flushSync runs only from this pointer-event path.
   */
  const performNativeToToolbarTransition = useCallback(
    (pointerId: number | null) => {
      // Refresh cached selection if still valid
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const refreshed = tryParseSelection(sel);
        if (refreshed) {
          cachedSelectionRef.current = refreshed.parsed;
          cachedRectRef.current = refreshed.rect;
          setSelection(refreshed.parsed);
        }
      }
      if (!cachedSelectionRef.current || !cachedRectRef.current) {
        resetToIdle();
        return;
      }
      const rectToCache = cachedRectRef.current;
      const parsedToCommit = cachedSelectionRef.current;
      flushSync(() => {
        phaseRef.current = "toolbar";
        setPhase("toolbar");
        setSelection(parsedToCommit);
      });
      // Now retained <mark> exists; clear native
      clearNativeSelection();
      // Prime popover positioning from cached rect; popover recomputes from mark
      cachedRectRef.current = rectToCache;
      onSelect?.(parsedToCommit);
      armSuppress(pointerId);
    },
    [tryParseSelection, resetToIdle, clearNativeSelection, onSelect, armSuppress]
  );

  // Outside-tap handlers: only for the touch workflow (native phase, or the
  // retained toolbar). Desktop toolbar installs NO document-level capture
  // handlers — dismissal is selection-driven, so normal desktop clicks are
  // never consumed (P1 #1).
  useEffect(() => {
    const active = phase === "native" || (phase === "toolbar" && touchMode);
    if (!active) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target;
      // Protect guest auth dialog
      if (isDialogTarget(target)) {
        // Clear stale toolbar but don't swallow dialog interaction
        if (phaseRef.current === "toolbar" || phaseRef.current === "native") {
          resetToIdle();
        }
        return;
      }
      // Inside popover — preserve
      if (popoverRef.current && target instanceof Node && popoverRef.current.contains(target)) {
        return;
      }
      const insideSelectable =
        selectableRef.current && target instanceof Node && selectableRef.current.contains(target);

      if (phaseRef.current === "native") {
        if (insideSelectable) {
          // Tap-vs-drag (P1 #2): a stationary tap inside the quote should
          // transition; dragging the selection handles should not. Track the
          // gesture and decide on pointerup.
          pendingTapRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
          tapDraggedRef.current = false;
          return;
        }
        // First outside tap: native → toolbar
        performNativeToToolbarTransition(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (phaseRef.current === "toolbar") {
        // Second outside tap: toolbar → idle
        armSuppress(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
        // Clear after suppress armed so click suppression can fire
        window.setTimeout(() => resetToIdle(), 0);
      }
    };

    const onPointerMoveCapture = (e: PointerEvent) => {
      if (!pendingTapRef.current) return;
      const tap = pendingTapRef.current;
      // Mark as drag once the pointer moves beyond a small slop threshold
      if (
        e.pointerId === tap.pointerId &&
        (Math.abs(e.clientX - tap.x) > 8 || Math.abs(e.clientY - tap.y) > 8)
      ) {
        tapDraggedRef.current = true;
      }
    };

    const onPointerUpCapture = (e: PointerEvent) => {
      const tap = pendingTapRef.current;
      if (!tap) return;
      pendingTapRef.current = null;
      if (e.pointerId !== tap.pointerId) return;
      if (tapDraggedRef.current) return;
      // Stationary tap inside the quote: perform the first transition
      if (phaseRef.current === "native" && cachedSelectionRef.current) {
        performNativeToToolbarTransition(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressNextClickRef.current) return;
      if (Date.now() > suppressDeadlineRef.current) {
        clearSuppress();
        return;
      }
      const target = e.target;
      // Dialogs are higher-priority UI (guest auth): let the click through
      if (isDialogTarget(target)) {
        clearSuppress();
        return;
      }
      // Popover interactions are never suppressed (P1 #3): a quick
      // Agree/Comment/Quote tap after the transition must work.
      if (popoverRef.current && target instanceof Node && popoverRef.current.contains(target)) {
        clearSuppress();
        return;
      }
      // Suppress only the click matching the consumed pointer (P1 #3).
      // MouseEvent has no pointerId; for touch, PointerEvent-driven clicks
      // carry a matching pointerId when available.
      const clickPointerId = (e as unknown as { pointerId?: number }).pointerId;
      if (
        suppressPointerIdRef.current !== null &&
        clickPointerId !== undefined &&
        clickPointerId !== suppressPointerIdRef.current
      ) {
        // Different pointer than the consumed gesture — let it through
        clearSuppress();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (
        typeof (e as unknown as { stopImmediatePropagation?: () => void })
          .stopImmediatePropagation === "function"
      ) {
        (e as unknown as { stopImmediatePropagation: () => void }).stopImmediatePropagation!();
      }
      clearSuppress();
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("pointermove", onPointerMoveCapture, true);
    document.addEventListener("pointerup", onPointerUpCapture, true);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("pointermove", onPointerMoveCapture, true);
      document.removeEventListener("pointerup", onPointerUpCapture, true);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [
    phase,
    touchMode,
    performNativeToToolbarTransition,
    resetToIdle,
    onSelect,
    onDeselect,
    armSuppress,
    clearSuppress,
  ]);

  const findChunksAtBeginningOfWords = useCallback(
    () => [{ start: startWordIndex > 0 ? startWordIndex : 0, end: endWordIndex }],
    [startWordIndex, endWordIndex]
  );

  const findRetainedChunks = useCallback(() => {
    const s = cachedSelectionRef.current;
    if (!s) return [];
    return [{ start: s.startIndex, end: s.endIndex }];
  }, []);

  const disableContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
  }, []);

  const handlePassageClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-linked-passage="true"]')) {
        e.preventDefault();
        onHighlightClick?.();
      }
    },
    [onHighlightClick]
  );

  const resolveAnchorRect = useCallback((): DOMRect | null => {
    // Retained (touch) toolbar: prefer retained mark rect, fall back to cached
    // native rect during the transition frame.
    if (phaseRef.current === "toolbar" && touchModeRef.current) {
      const mark = document.querySelector(
        '[data-testid="retained-selection-highlight"]'
      ) as HTMLElement | null;
      if (mark) {
        const r = mark.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return r;
      }
      if (cachedRectRef.current) return cachedRectRef.current;
      return null;
    }
    // Desktop toolbar (immediate) or native measurement: live range
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        const r = sel.getRangeAt(0).getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return r;
      } catch {
        // ignore
      }
    }
    if (cachedRectRef.current) return cachedRectRef.current;
    return null;
  }, []);

  // Popover visibility: retained (touch) or desktop-immediate toolbar
  const showRetainedPopover = phase === "toolbar" && hasValidRetainedSelection;
  const showDesktopPopover = phase === "toolbar" && !touchMode && selection.text.length > 0;
  const effectiveShowPopover = showRetainedPopover || showDesktopPopover;

  const renderRetained = () => (
    <Highlighter
      style={{ whiteSpace: "pre-line" }}
      highlightClassName={RETAINED_PASSAGE_CLASS}
      highlightTag={RetainedPassageMark}
      textToHighlight={content}
      searchWords={[]}
      findChunks={findRetainedChunks}
      autoEscape
      onContextMenu={disableContextMenu}
    />
  );

  const renderHighlights = () => {
    // Explicit priority branch (refinement 4): retained takes precedence,
    // hasLinkedRange is not mutated so the linked highlight returns after
    // dismissal.
    if (phase === "toolbar" && hasValidRetainedSelection) {
      return renderRetained();
    }

    if (highlights) {
      if (hasLinkedRange) {
        return (
          <Highlighter
            style={{ whiteSpace: "pre-line" }}
            highlightClassName={LINKED_PASSAGE_CLASS}
            highlightTag={LinkedPassageMark}
            textToHighlight={content}
            searchWords={[]}
            findChunks={findChunksAtBeginningOfWords}
            autoEscape
            onContextMenu={disableContextMenu}
          />
        );
      }

      return (
        <Highlighter
          style={{ whiteSpace: "pre-line" }}
          highlightClassName={LINKED_PASSAGE_CLASS}
          searchWords={[highlightedText]}
          textToHighlight={content}
          autoEscape
          caseSensitive
          onContextMenu={disableContextMenu}
        />
      );
    }

    return content.split(/\n/g).map((line, contentIndex) => (
      <Fragment key={`frag-${contentIndex}`}>
        {line.split(/\s+/g).map((word, index) => (
          <span key={`${index}-${word}`}>{`${word} `}</span>
        ))}
        <br />
      </Fragment>
    ));
  };

  return (
    <div className="relative h-full flex flex-col" style={style}>
      <div ref={selectableRef} data-selectable className="flex-1">
        <p
          ref={contentRef}
          className="voting_board-content m-0 p-0 h-full"
          onContextMenu={disableContextMenu}
          onClick={handlePassageClick}
        >
          {renderHighlights()}
        </p>
      </div>
      <SelectionPopover
        showPopover={effectiveShowPopover}
        topOffset={topOffset}
        resolveAnchorRect={resolveAnchorRect}
        popoverRef={popoverRef}
      >
        {children && children(selection)}
      </SelectionPopover>
    </div>
  );
}

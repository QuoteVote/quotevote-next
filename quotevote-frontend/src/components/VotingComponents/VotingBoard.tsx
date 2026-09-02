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

  const [touchMode, setTouchMode] = useState(false);
  const touchModeRef = useRef(false);

  const cachedRectRef = useRef<DOMRect | null>(null);
  const cachedSelectionRef = useRef<SelectedText | null>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const selectableRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const suppressNextClickRef = useRef(false);
  const suppressPointerIdRef = useRef<number | null>(null);
  const suppressDeadlineRef = useRef<number>(0);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingTapRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const tapDraggedRef = useRef(false);

  const pendingDismissRef = useRef(false);

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

  const clearNativeSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
  }, []);

  const resetToIdle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearSuppress();
    cachedRectRef.current = null;
    cachedSelectionRef.current = null;
    touchModeRef.current = false;
    setTouchMode(false);
    pendingTapRef.current = null;
    pendingDismissRef.current = false;
    setSelection({ startIndex: 0, endIndex: 0, text: "", points: 0 });
    setPhaseSynced("idle");
    onDeselect?.();
  }, [clearSuppress, onDeselect, setPhaseSynced]);

  const armSuppress = useCallback(
    (pointerId: number | null) => {
      suppressNextClickRef.current = true;
      suppressPointerIdRef.current = pointerId;
      suppressDeadlineRef.current = Date.now() + 750;
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = setTimeout(() => {
        clearSuppress();
        if (pendingDismissRef.current) {
          pendingDismissRef.current = false;
          resetToIdle();
        }
      }, 800);
    },
    [clearSuppress, resetToIdle]
  );

  const commentData = focusedComment || null;
  const startWordIndex = commentData?.startWordIndex ?? 0;
  const endWordIndex = commentData?.endWordIndex ?? 0;
  const highlightedText = content
    .substring(startWordIndex, endWordIndex)
    .replace(/(\r\n|\n|\r)/gm, "");
  const hasLinkedRange = endWordIndex > startWordIndex;

  const hasValidRetainedSelection =
    phase === "toolbar" &&
    touchMode &&
    selection.endIndex > selection.startIndex &&
    selection.text.length > 0;

  useLayoutEffect(() => {
    if (!hasLinkedRange) return;
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

  const prevContentRef = useRef(content);
  useEffect(() => {
    if (prevContentRef.current === content) return;
    prevContentRef.current = content;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replacing content invalidates the active selection state
    resetToIdle();
  }, [content, resetToIdle]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(TOUCH_MEDIA_QUERY);
    const handler = () => {
      resetToIdle();
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    const legacy = mql as unknown as {
      addListener: (cb: () => void) => void;
      removeListener: (cb: () => void) => void;
    };
    if (legacy.addListener) {
      legacy.addListener(handler);
      return () => legacy.removeListener(handler);
    }
    return undefined;
  }, [resetToIdle]);

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
      if (phaseRef.current === "native") {
        if (!cachedSelectionRef.current) resetToIdle();
        return;
      }
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

    const delayed = isCoarseTouchEnvironment();
    touchModeRef.current = delayed;
    setTouchMode(delayed);
    if (delayed) {
      setPhaseSynced("native");
    } else {
      setPhaseSynced("toolbar");
      onSelect?.(parsed);
    }
  }, [tryParseSelection, resetToIdle, setPhaseSynced, onSelect]);

  useEffect(() => {
    const target = selectableRef.current;
    if (!target) return;

    const onSelectStart = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        handleSelectionChange();
      }, 100);
    };
    const onPointerUp = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.setTimeout(handleSelectionChange, 0);
    };

    target.addEventListener("selectstart", onSelectStart);
    target.addEventListener("pointerup", onPointerUp);
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

  const performNativeToToolbarTransition = useCallback(
    (pointerId: number | null) => {
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
      clearNativeSelection();
      cachedRectRef.current = rectToCache;
      onSelect?.(parsedToCommit);
      armSuppress(pointerId);
    },
    [tryParseSelection, resetToIdle, clearNativeSelection, onSelect, armSuppress]
  );

  useEffect(() => {
    const active = phase === "native" || (phase === "toolbar" && touchMode);
    if (!active) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target;
      if (isDialogTarget(target)) {
        if (phaseRef.current === "toolbar" || phaseRef.current === "native") {
          resetToIdle();
        }
        return;
      }
      if (popoverRef.current && target instanceof Node && popoverRef.current.contains(target)) {
        return;
      }
      const insideSelectable =
        selectableRef.current && target instanceof Node && selectableRef.current.contains(target);

      if (phaseRef.current === "native") {
        if (insideSelectable) {
          pendingTapRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
          tapDraggedRef.current = false;
          return;
        }
        performNativeToToolbarTransition(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (phaseRef.current === "toolbar") {
        pendingDismissRef.current = true;
        armSuppress(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onPointerMoveCapture = (e: PointerEvent) => {
      if (!pendingTapRef.current) return;
      const tap = pendingTapRef.current;
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
      if (phaseRef.current === "native" && cachedSelectionRef.current) {
        performNativeToToolbarTransition(e.pointerId ?? null);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("pointermove", onPointerMoveCapture, true);
    document.addEventListener("pointerup", onPointerUpCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("pointermove", onPointerMoveCapture, true);
      document.removeEventListener("pointerup", onPointerUpCapture, true);
    };
  }, [phase, touchMode, performNativeToToolbarTransition, resetToIdle, armSuppress]);

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const hasSuppress = suppressNextClickRef.current;
      const hasPendingDismiss = pendingDismissRef.current;
      if (!hasSuppress && !hasPendingDismiss) return;
      if (hasSuppress && Date.now() > suppressDeadlineRef.current) {
        clearSuppress();
        if (hasPendingDismiss) {
          pendingDismissRef.current = false;
          resetToIdle();
        }
        return;
      }
      const target = e.target;
      if (isDialogTarget(target)) {
        clearSuppress();
        pendingDismissRef.current = false;
        return;
      }
      if (popoverRef.current && target instanceof Node && popoverRef.current.contains(target)) {
        clearSuppress();
        pendingDismissRef.current = false;
        return;
      }
      if (!hasSuppress) {
        if (hasPendingDismiss) {
          pendingDismissRef.current = false;
          resetToIdle();
        }
        return;
      }
      const clickPointerId = (e as unknown as { pointerId?: number }).pointerId;
      if (
        suppressPointerIdRef.current !== null &&
        clickPointerId !== undefined &&
        clickPointerId !== suppressPointerIdRef.current
      ) {
        clearSuppress();
        pendingDismissRef.current = false;
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      clearSuppress();
      if (hasPendingDismiss) {
        pendingDismissRef.current = false;
        resetToIdle();
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [clearSuppress, resetToIdle]);

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

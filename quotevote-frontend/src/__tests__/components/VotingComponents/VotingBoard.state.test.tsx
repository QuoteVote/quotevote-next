/**
 * VotingBoard — state machine tests (issue #484)
 * Covers P1#1 desktop gating, P1#2 tap-vs-drag, P1#3 popover exemption is via
 * suppression logic in the component, and P2#3 coverage gaps.
 */

import { render, screen, fireEvent, waitFor, act } from "@/__tests__/utils/test-utils";
import VotingBoard from "@/components/VotingComponents/VotingBoard";

// Polyfill PointerEvent for jsdom
if (typeof window !== "undefined" && typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
  (global as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
}

// Keep Highlighter mock simple but allow findChunks to determine visibility
jest.mock("react-highlight-words", () => ({
  __esModule: true,
  default: ({
    textToHighlight,
    highlightTag: Tag,
    findChunks,
  }: {
    textToHighlight: string;
    highlightTag?: React.ElementType;
    findChunks?: () => Array<{ start: number; end: number }>;
  }) => {
    const chunks = findChunks?.() ?? [];
    const first = chunks[0];
    if (Tag && first && first.end > first.start) {
      return (
        <span data-testid="highlighter">
          <Tag>{textToHighlight.slice(first.start, first.end)}</Tag>
        </span>
      );
    }
    return <span data-testid="highlighter">{textToHighlight}</span>;
  },
}));

// Pure portal mock that forwards popoverRef so suppression exemption can be tested
jest.mock("@/components/VotingComponents/SelectionPopover", () => {
  function MockSelectionPopover({
    children,
    showPopover,
    popoverRef,
  }: {
    children: React.ReactNode;
    showPopover: boolean;
    popoverRef: React.RefObject<HTMLDivElement | null>;
  }) {
    const { useEffect, useRef } = jest.requireActual("react") as typeof import("react");
    const innerRef = (useRef as unknown as () => React.RefObject<HTMLDivElement | null>)();
    useEffect(() => {
      if (popoverRef) {
        (popoverRef as React.MutableRefObject<HTMLDivElement | null>).current = innerRef.current;
      }
    }, [showPopover, innerRef, popoverRef]);

    return (
      <div
        ref={innerRef as React.RefObject<HTMLDivElement>}
        data-testid="selection-popover"
        data-show={String(showPopover)}
      >
        {showPopover ? children : null}
      </div>
    );
  }
  return {
    __esModule: true,
    default: MockSelectionPopover,
  };
});

const CONTENT = "hello world hello world unique end";

const FAKE_RECT = {
  width: 100,
  height: 20,
  top: 100,
  left: 50,
  right: 150,
  bottom: 120,
  x: 50,
  y: 100,
  toJSON() {},
} as unknown as DOMRect;

function mockTouch(isTouch: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: isTouch && query === "(hover: none) and (pointer: coarse)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

function textNodesUnder(el: Element): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  return nodes;
}

function setSelectionForSubstring(container: HTMLElement, substring: string): Range {
  const p = container.querySelector(".voting_board-content") as HTMLElement;
  if (!p) throw new Error("voting_board-content not found");
  const nodes = textNodesUnder(p);
  const full = nodes.map((n) => n.textContent ?? "").join("");
  const startIdx = full.indexOf(substring);
  if (startIdx === -1) throw new Error(`substring "${substring}" not found in "${full}"`);
  const endIdx = startIdx + substring.length;
  let acc = 0;
  let startNode: Text | undefined;
  let startOffset = 0;
  let endNode: Text | undefined;
  let endOffset = 0;
  for (const n of nodes) {
    const len = n.textContent?.length ?? 0;
    if (startNode === undefined && acc + len > startIdx) {
      startNode = n;
      startOffset = startIdx - acc;
    }
    if (startNode !== undefined && acc + len >= endIdx) {
      endNode = n;
      endOffset = endIdx - acc;
      break;
    }
    acc += len;
  }
  if (!startNode || !endNode) throw new Error("range nodes not resolved");
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  // Direct stub — Range instances in jsdom may not have own getBoundingClientRect
  (range as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect = () =>
    FAKE_RECT;
  const sel = window.getSelection();
  if (!sel) throw new Error("no selection");
  sel.removeAllRanges();
  sel.addRange(range);
  return range;
}

function dispatchPointer(
  target: Element | Document,
  type: string,
  init: Partial<PointerEventInit & { pointerId: number }> = {}
) {
  const EventCtor =
    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent ??
    (global as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent ??
    MouseEvent;
  const event = new (EventCtor as unknown as new (type: string, init: unknown) => Event)(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 5,
    clientY: init.clientY ?? 5,
    pointerId: (init as { pointerId?: number }).pointerId ?? 1,
    ...init,
  } as PointerEventInit);
  // Ensure pointerId is set even if ctor ignored it
  if ((init as { pointerId?: number }).pointerId !== undefined) {
    Object.defineProperty(event, "pointerId", {
      value: (init as { pointerId?: number }).pointerId,
      writable: true,
    });
  }
  target.dispatchEvent(event);
  return event;
}

function dispatchClick(target: Element, pointerId?: number, init: Partial<MouseEventInit> = {}) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (pointerId !== undefined) {
    Object.defineProperty(event, "pointerId", {
      value: pointerId,
      writable: true,
    });
  }
  target.dispatchEvent(event);
  return event;
}

describe("VotingBoard — state machine (issue #484)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    // Stub Range rect globally for all ranges created in these tests
    if (!Range.prototype.getBoundingClientRect) {
      Range.prototype.getBoundingClientRect = () => FAKE_RECT;
    }
    jest.spyOn(Range.prototype, "getBoundingClientRect").mockReturnValue(FAKE_RECT);
    mockTouch(false);
    window.getSelection()?.removeAllRanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.getSelection()?.removeAllRanges();
    document.body.innerHTML = "";
    // Clear any interval/suppression timers that were using real timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("desktop: selection opens popover immediately without retained mark", async () => {
    mockTouch(false);
    const onSelect = jest.fn();
    const onDeselect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect} onDeselect={onDeselect}>
        {(sel) => <span data-testid="sel-text">{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");

    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0].text).toBe("hello");
    const popover = screen.getByTestId("selection-popover");
    expect(popover.dataset.show).toBe("true");
    // Desktop never renders the retained mobile mark
    expect(screen.queryByTestId("retained-selection-highlight")).not.toBeInTheDocument();
    expect(onDeselect).not.toHaveBeenCalled();
  });

  it("desktop: selection collapse dismisses the toolbar (no outside-tap handler)", async () => {
    mockTouch(false);
    const onSelect = jest.fn();
    const onDeselect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect} onDeselect={onDeselect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    await waitFor(() => expect(onSelect).toHaveBeenCalled());

    // Collapse the selection (click elsewhere) — desktop should dismiss via selectionchange
    window.getSelection()?.removeAllRanges();
    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    await waitFor(() => expect(onDeselect).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");
  });

  it("touch: valid selection enters native (popover hidden) before first tap", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onSelect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    const selectable = container.querySelector("[data-selectable]") as HTMLElement;
    fireEvent(selectable, new Event("selectstart"));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Polling should have stored the selection but not opened the toolbar
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");
    expect(screen.queryByTestId("retained-selection-highlight")).not.toBeInTheDocument();
    // Native selection still intact
    expect(window.getSelection()?.toString()).toBe("hello");
  });

  it("touch: first outside tap transitions to toolbar, retains highlight, clears native", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onSelect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect}>
        {(sel) => <span data-testid="sel-text">{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    const selectable = container.querySelector("[data-selectable]") as HTMLElement;
    fireEvent(selectable, new Event("selectstart"));
    act(() => {
      jest.advanceTimersByTime(150);
    });

    const outside = document.createElement("div");
    outside.setAttribute("data-testid", "outside");
    document.body.appendChild(outside);

    await act(async () => {
      dispatchPointer(document, "pointerdown", { pointerId: 1, clientX: 5, clientY: 5 });
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].text).toBe("hello");
    expect(window.getSelection()?.toString()).toBe("");
    await waitFor(() => expect(screen.getByTestId("selection-popover").dataset.show).toBe("true"));
    // Retained mark rendered with exact occurrence (findChunks mock renders Tag)
    expect(screen.getByTestId("retained-selection-highlight")).toBeInTheDocument();
  });

  it("touch: stationary tap inside the quote performs the first transition; drag does not", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onSelect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    // First selection -> native
    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    fireEvent(
      container.querySelector("[data-selectable]") as HTMLElement,
      new Event("selectstart")
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");

    const p = container.querySelector(".voting_board-content") as HTMLElement;

    // Stationary tap inside the quote — must dispatch only on the inside
    // target. Dispatching on document first would already trigger the
    // outside-transition and give false confidence (P2 #3).
    await act(async () => {
      dispatchPointer(p, "pointerdown", { pointerId: 2, clientX: 60, clientY: 60 });
      dispatchPointer(p, "pointerup", { pointerId: 2, clientX: 60, clientY: 60 });
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("true");

    // Reset for drag case
    window.getSelection()?.removeAllRanges();
    jest.useRealTimers();
    jest.useFakeTimers();
    mockTouch(true);

    const { container: container2 } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );
    setSelectionForSubstring(container2 as unknown as HTMLElement, "world");
    fireEvent(
      container2.querySelector("[data-selectable]") as HTMLElement,
      new Event("selectstart")
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onSelect.mockClear();
    const p2 = container2.querySelector(".voting_board-content") as HTMLElement;

    await act(async () => {
      dispatchPointer(p2, "pointerdown", { pointerId: 3, clientX: 60, clientY: 60 });
      dispatchPointer(document, "pointermove", { pointerId: 3, clientX: 120, clientY: 60 });
      dispatchPointer(p2, "pointermove", { pointerId: 3, clientX: 120, clientY: 60 });
      dispatchPointer(p2, "pointerup", { pointerId: 3, clientX: 120, clientY: 60 });
    });

    // Dragged gesture should NOT transition
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByTestId("selection-popover").pop()?.dataset.show).toBe("false");
  });

  it("touch: second outside tap dismisses via click and does not activate underlying UI", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onDeselect = jest.fn();
    const onSelect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect} onDeselect={onDeselect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    fireEvent(
      container.querySelector("[data-selectable]") as HTMLElement,
      new Event("selectstart")
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });

    await act(async () => {
      dispatchPointer(document, "pointerdown", { pointerId: 5, clientX: 5, clientY: 5 });
    });
    await waitFor(() => expect(screen.getByTestId("selection-popover").dataset.show).toBe("true"));

    // Underlying UI that would be activated if click were not suppressed
    const underlying = document.createElement("button");
    underlying.setAttribute("data-testid", "underlying-button");
    document.body.appendChild(underlying);
    const underlyingClick = jest.fn();
    underlying.addEventListener("click", underlyingClick);

    // Second outside tap — arms suppression and sets pendingDismiss, does NOT
    // reset immediately (P1 #1). The delayed compatibility click must be
    // consumed before we go idle.
    await act(async () => {
      dispatchPointer(document, "pointerdown", { pointerId: 6, clientX: 5, clientY: 5 });
    });
    // Toolbar is still visible until the click is handled
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("true");
    expect(onDeselect).not.toHaveBeenCalled();

    // Delayed click on the underlying button — should be suppressed
    const clickEvent = await act(async () => {
      return dispatchClick(underlying, 6);
    });

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(underlyingClick).not.toHaveBeenCalled();
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");
    expect(screen.queryByTestId("retained-selection-highlight")).not.toBeInTheDocument();
  });

  it("touch: first-transition suppression does not swallow toolbar actions", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onSelect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onSelect={onSelect}>
        {(sel) => (
          <span>
            {sel.text}
            <button data-testid="toolbar-action">Agree</button>
          </span>
        )}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    fireEvent(
      container.querySelector("[data-selectable]") as HTMLElement,
      new Event("selectstart")
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });

    await act(async () => {
      dispatchPointer(document, "pointerdown", { pointerId: 10, clientX: 5, clientY: 5 });
    });
    await waitFor(() => expect(screen.getByTestId("selection-popover").dataset.show).toBe("true"));

    const popover = screen.getByTestId("selection-popover");
    const action = screen.getByTestId("toolbar-action");
    const actionClick = jest.fn();
    action.addEventListener("click", actionClick);

    // Quick tap on the toolbar action within the 750ms suppression window.
    // The click target is inside popoverRef, so it must be let through (P1 #3).
    const toolbarClick = await act(async () => {
      return dispatchClick(action, 10);
    });

    expect(toolbarClick.defaultPrevented).toBe(false);
    expect(actionClick).toHaveBeenCalledTimes(1);
    // Toolbar stays open — suppression was cleared without dismissing
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("true");
    expect(popover.contains(action)).toBe(true);
  });

  it("touch: dialog target clears stale toolbar without swallowing the dialog event", async () => {
    jest.useFakeTimers();
    mockTouch(true);
    const onDeselect = jest.fn();
    const { container } = render(
      <VotingBoard content={CONTENT} onDeselect={onDeselect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    fireEvent(
      container.querySelector("[data-selectable]") as HTMLElement,
      new Event("selectstart")
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });
    await act(async () => {
      dispatchPointer(document, "pointerdown", { pointerId: 7, clientX: 5, clientY: 5 });
    });
    await waitFor(() => expect(screen.getByTestId("selection-popover").dataset.show).toBe("true"));

    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    const btn = document.createElement("button");
    btn.textContent = "dialog action";
    dialog.appendChild(btn);
    document.body.appendChild(dialog);

    const defaultPreventedBefore = { called: false };
    await act(async () => {
      const ev = dispatchPointer(btn, "pointerdown", { pointerId: 8, clientX: 10, clientY: 10 });
      defaultPreventedBefore.called = ev.defaultPrevented;
    });

    expect(onDeselect).toHaveBeenCalled();
    // Dialog events must not be prevented
    expect(defaultPreventedBefore.called).toBe(false);
    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");
  });

  it("resets on content change", async () => {
    mockTouch(false);
    const onDeselect = jest.fn();
    const { container, rerender } = render(
      <VotingBoard content={CONTENT} onDeselect={onDeselect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    setSelectionForSubstring(container as unknown as HTMLElement, "hello");
    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    await waitFor(() => expect(screen.getByTestId("selection-popover").dataset.show).toBe("true"));

    rerender(
      <VotingBoard content="completely new content for reset" onDeselect={onDeselect}>
        {(sel) => <span>{sel.text}</span>}
      </VotingBoard>
    );

    expect(screen.getByTestId("selection-popover").dataset.show).toBe("false");
    expect(onDeselect).toHaveBeenCalled();
  });
});

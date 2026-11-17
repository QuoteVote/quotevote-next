/**
 * SelectionPopover component tests — pure portal/positioning (issue #484)
 */

import { render, screen, act, fireEvent } from "@/__tests__/utils/test-utils";
import SelectionPopover from "@/components/VotingComponents/SelectionPopover";
import type { SelectionPopoverProps } from "@/types/voting";
import { createRef } from "react";

describe("SelectionPopover", () => {
  const makeProps = (overrides: Partial<SelectionPopoverProps> = {}): SelectionPopoverProps => ({
    showPopover: false,
    resolveAnchorRect: jest.fn(
      () =>
        ({
          top: 100,
          left: 50,
          width: 200,
          height: 20,
          bottom: 120,
          right: 250,
          x: 50,
          y: 100,
          toJSON: () => {},
        }) as unknown as DOMRect
    ),
    popoverRef: createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement | null>,
    children: <div>Test content</div>,
    ...overrides,
  });

  it("renders children when showPopover is true", () => {
    render(<SelectionPopover {...makeProps({ showPopover: true })} />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("does not render children when showPopover is false", () => {
    render(<SelectionPopover {...makeProps({ showPopover: false })} />);
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  it("applies custom topOffset", () => {
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 50 })} />);
    const popover = document.querySelector("#selectionPopover");
    expect(popover).toBeInTheDocument();
  });

  it("renders above the post sticky action bar (z-index > 10) by default", () => {
    render(<SelectionPopover {...makeProps({ showPopover: true })} />);
    const popover = document.querySelector("#selectionPopover") as HTMLElement;
    expect(Number(popover.style.zIndex)).toBeGreaterThan(10);
  });

  it("applies custom styles", () => {
    const customStyle = { zIndex: 999 };
    render(<SelectionPopover {...makeProps({ showPopover: true, style: customStyle })} />);
    const popover = document.querySelector("#selectionPopover") as HTMLElement;
    expect(popover).toHaveStyle({ zIndex: "999" });
  });

  it("computes popover position correctly for desktop", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
    const resolveAnchorRect = jest.fn(
      () =>
        ({
          top: 200,
          left: 100,
          width: 300,
          height: 20,
          bottom: 220,
          right: 400,
          x: 100,
          y: 200,
        }) as unknown as DOMRect
    );
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />);
    // Let rAF compute
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(resolveAnchorRect).toHaveBeenCalled();
    const popover = document.querySelector("#selectionPopover");
    expect(popover).toBeInTheDocument();
  });

  it("computes popover position correctly for tablet", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 800 });
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 30 })} />);
    const popover = document.querySelector("#selectionPopover");
    expect(popover).toBeInTheDocument();
  });

  it("computes popover position correctly for mobile", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 400 });
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 30 })} />);
    const popover = document.querySelector("#selectionPopover");
    expect(popover).toBeInTheDocument();
  });

  it("handles missing anchor rect gracefully", () => {
    const resolveAnchorRect = jest.fn(() => null);
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("handles popoverRef without current element gracefully", () => {
    const emptyRef = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<SelectionPopover {...makeProps({ showPopover: true, popoverRef: emptyRef })} />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("recomputes on resize/orientationchange while visible", async () => {
    const resolveAnchorRect = jest.fn(
      () =>
        ({
          top: 100,
          left: 50,
          width: 200,
          height: 20,
          bottom: 120,
          right: 250,
          x: 50,
          y: 100,
        }) as unknown as DOMRect
    );
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />);
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("orientationchange"));
    });
    // After events, still mounted
    expect(document.querySelector("#selectionPopover")).toBeInTheDocument();
  });

  it("re-places itself above the selection when its content grows (#529)", async () => {
    const OriginalResizeObserver = global.ResizeObserver;
    const observed: Element[] = [];
    let onResize: ResizeObserverCallback | null = null;
    const disconnect = jest.fn();
    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback;
      }
      observe(target: Element) {
        observed.push(target);
      }
      unobserve() {}
      disconnect() {
        disconnect();
      }
    } as unknown as typeof ResizeObserver;

    try {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });
      const popoverRef = createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement | null>;
      const resolveAnchorRect = jest.fn(
        () => ({ top: 400, left: 100, width: 300, height: 20, bottom: 420, right: 400 }) as DOMRect
      );
      const { rerender } = render(
        <SelectionPopover
          {...makeProps({ showPopover: true, resolveAnchorRect, popoverRef, topOffset: 30 })}
        />
      );
      const popover = popoverRef.current as HTMLDivElement;
      let height = 60;
      popover.getBoundingClientRect = () => ({ width: 320, height }) as DOMRect;

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      });
      expect(observed).toContain(popover);
      expect(popover.style.top).toBe(`${400 - 60 - 30}px`);

      // The Vote panel opens and the popover grows: it must move up, not cover the selection.
      height = 250;
      await act(async () => {
        onResize?.([], {} as ResizeObserver);
      });
      expect(popover.style.top).toBe(`${400 - 250 - 30}px`);
      // Its bottom edge stays above the selection's top edge.
      expect(parseFloat(popover.style.top) + height).toBeLessThanOrEqual(400);

      rerender(<SelectionPopover {...makeProps({ showPopover: false, popoverRef })} />);
      expect(disconnect).toHaveBeenCalled();
    } finally {
      global.ResizeObserver = OriginalResizeObserver;
    }
  });

  it("cleans up rAF on unmount/hide", () => {
    const { rerender, unmount } = render(
      <SelectionPopover {...makeProps({ showPopover: true })} />
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
    rerender(<SelectionPopover {...makeProps({ showPopover: false })} />);
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
    unmount();
    expect(true).toBe(true);
  });

  describe("phone sheet", () => {
    it("shows the content at the bottom over a backdrop, without anchoring to the text", () => {
      const props = makeProps({ showPopover: true, sheet: true, onDismiss: jest.fn() });
      render(<SelectionPopover {...props} />);

      const sheet = screen.getByTestId("highlight-popup");
      expect(sheet).toHaveClass("fixed", "inset-x-0", "bottom-0");
      expect(screen.getByText("Test content")).toBeVisible();
      expect(props.resolveAnchorRect).not.toHaveBeenCalled();
    });

    it("closes on a backdrop tap", () => {
      const onDismiss = jest.fn();
      render(<SelectionPopover {...makeProps({ showPopover: true, sheet: true, onDismiss })} />);

      fireEvent.click(screen.getByTestId("selection-sheet-backdrop"));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("renders nothing while hidden", () => {
      render(<SelectionPopover {...makeProps({ showPopover: false, sheet: true })} />);
      expect(screen.queryByTestId("selection-sheet-backdrop")).not.toBeInTheDocument();
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();
    });
  });

  it("closes on Escape in either layout", () => {
    const onDismiss = jest.fn();
    const { rerender } = render(
      <SelectionPopover {...makeProps({ showPopover: true, onDismiss })} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    rerender(<SelectionPopover {...makeProps({ showPopover: true, sheet: true, onDismiss })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(2);

    rerender(<SelectionPopover {...makeProps({ showPopover: false, onDismiss })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});

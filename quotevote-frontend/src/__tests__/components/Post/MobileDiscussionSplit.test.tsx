import { createEvent, fireEvent, render, screen } from "@/__tests__/utils/test-utils";
import MobileDiscussionSplit from "@/components/Post/MobileDiscussionSplit";
import { DEFAULT_QUOTE_RATIO, SPLIT_RATIO_STORAGE_KEY } from "@/types/discussionSplit";

function firePointer(
  element: Element,
  type: "pointerDown" | "pointerMove",
  clientY: number
) {
  const event = createEvent[type](element, { bubbles: true, pointerId: 1 });
  Object.assign(event, { clientY, pointerId: 1, pointerType: "touch" });
  fireEvent(element, event);
}

function stubSplitHeight(split: HTMLElement, height = 1000) {
  Object.defineProperty(split, "clientHeight", {
    configurable: true,
    get: () => height,
  });
}

describe("MobileDiscussionSplit", () => {
  it("shows a compact Discussion bar when collapsed", () => {
    const onOpenChange = jest.fn();
    render(
      <MobileDiscussionSplit
        open={false}
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    expect(screen.getByTestId("discussion-reading-view")).toBeInTheDocument();
    const bar = screen.getByTestId("discussion-collapsed-bar");
    expect(bar).toHaveTextContent("Discussion · 2");
    expect(bar).toHaveStyle({ height: "56px" });
    expect(bar.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("discussion-divider")).not.toBeVisible();

    fireEvent.click(bar);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("opens a 45/55 split with a draggable divider", () => {
    const onOpenChange = jest.fn();
    render(
      <MobileDiscussionSplit
        open
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    expect(screen.getByTestId("discussion-split-view")).toBeInTheDocument();
    expect(screen.getByTestId("discussion-divider")).toBeInTheDocument();
    expect(screen.getByLabelText("Collapse discussion")).toBeInTheDocument();
    expect(screen.getByText("Discussion · 2")).toBeInTheDocument();
    expect(screen.queryByTestId("discussion-collapsed-bar")).not.toBeInTheDocument();

    const quotePane = screen
      .getByTestId("discussion-split-view")
      .querySelector('[data-post-detail-pane="content"]') as HTMLElement;
    expect(quotePane).toHaveStyle({ height: `${Math.round(DEFAULT_QUOTE_RATIO * 100)}%` });

    fireEvent.click(screen.getByLabelText("Collapse discussion"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("restores the default split height after collapsing with the caret", () => {
    const onOpenChange = jest.fn();
    const { rerender } = render(
      <MobileDiscussionSplit
        open
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    fireEvent.click(screen.getByLabelText("Collapse discussion"));
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      SPLIT_RATIO_STORAGE_KEY,
      String(DEFAULT_QUOTE_RATIO)
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <MobileDiscussionSplit
        open={false}
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );
    rerender(
      <MobileDiscussionSplit
        open
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    const quotePane = screen
      .getByTestId("discussion-split-view")
      .querySelector('[data-post-detail-pane="content"]') as HTMLElement;
    expect(quotePane).toHaveStyle({ height: `${Math.round(DEFAULT_QUOTE_RATIO * 100)}%` });
  });

  it("keeps quote and discussion content mounted while collapsed", () => {
    render(
      <MobileDiscussionSplit
        open={false}
        onOpenChange={jest.fn()}
        discussionCount={0}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    expect(screen.getByText("Quote body")).toBeInTheDocument();
    expect(screen.getByText("Discussion body")).toBeInTheDocument();
  });

  it("resizes when dragging the discussion header, not only the 4px pill", () => {
    render(
      <MobileDiscussionSplit
        open
        onOpenChange={jest.fn()}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    const split = screen.getByTestId("discussion-split-view");
    stubSplitHeight(split);

    firePointer(screen.getByText("Discussion · 2"), "pointerDown", 400);
    firePointer(screen.getByTestId("discussion-resize-handle"), "pointerMove", 500);

    const quotePane = split.querySelector(
      '[data-post-detail-pane="content"]'
    ) as HTMLElement;
    expect(quotePane).toHaveStyle({ height: "55%" });
  });

  it("does not start a resize from the collapse button", () => {
    const onOpenChange = jest.fn();
    render(
      <MobileDiscussionSplit
        open
        onOpenChange={onOpenChange}
        discussionCount={2}
        quotePane={<div>Quote body</div>}
      >
        <div>Discussion body</div>
      </MobileDiscussionSplit>
    );

    const split = screen.getByTestId("discussion-split-view");
    stubSplitHeight(split);
    const collapse = screen.getByLabelText("Collapse discussion");

    firePointer(collapse, "pointerDown", 400);
    firePointer(screen.getByTestId("discussion-resize-handle"), "pointerMove", 500);

    const quotePane = split.querySelector(
      '[data-post-detail-pane="content"]'
    ) as HTMLElement;
    expect(quotePane).toHaveStyle({
      height: `${Math.round(DEFAULT_QUOTE_RATIO * 100)}%`,
    });

    fireEvent.click(collapse);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

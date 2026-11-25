/**
 * VotingBoard passage activity marks (#548), rendered with the real
 * react-highlight-words so the marks line up with the text.
 */

import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import VotingBoard from "@/components/VotingComponents/VotingBoard";
import type { PassageActivitySegment } from "@/types/voting";

jest.mock("@/components/VotingComponents/SelectionPopover", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const CONTENT = "Charging for it would raise money for bus lanes. Small shops worry.";

const ACTIVITY: PassageActivitySegment[] = [
  {
    start: 22,
    end: 47,
    upvotes: 2,
    downvotes: 0,
    quotes: 0,
    comments: 1,
    actionIds: ["c1", "v1", "v2"],
  },
  {
    start: 49,
    end: 66,
    upvotes: 0,
    downvotes: 1,
    quotes: 0,
    comments: 0,
    actionIds: ["v3"],
  },
];

describe("VotingBoard passage activity", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    window.getSelection()?.removeAllRanges();
  });

  it("marks each active passage with its count and an accessible name", () => {
    render(<VotingBoard content={CONTENT} highlights activity={ACTIVITY} />);
    const marks = screen.getAllByTestId("passage-activity");
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveTextContent("raise money for bus lanes");
    expect(marks[0]).toHaveAttribute("data-count", "3");
    expect(marks[0]).toHaveAccessibleName(
      "raise money for bus lanes: 2 votes and 1 comment. Show in Discussion"
    );
    expect(marks[1]).toHaveAttribute("data-count", "1");
    expect(screen.getByRole("button", { name: /Small shops worry: 1 vote/ })).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  it("keeps the post text unchanged, since the count is not part of it", () => {
    const { container } = render(<VotingBoard content={CONTENT} highlights activity={ACTIVITY} />);
    expect(container.textContent).toContain(CONTENT);
  });

  it("calls onActivityClick with the passage on click, Enter and Space", () => {
    const onActivityClick = jest.fn();
    render(
      <VotingBoard
        content={CONTENT}
        highlights
        activity={ACTIVITY}
        onActivityClick={onActivityClick}
      />
    );
    const [first, second] = screen.getAllByTestId("passage-activity");
    fireEvent.click(first);
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.keyDown(first, { key: " " });
    expect(onActivityClick.mock.calls.map(([segment]) => segment)).toEqual([
      ACTIVITY[0],
      ACTIVITY[1],
      ACTIVITY[0],
    ]);
  });

  it("ignores the click that ends a text selection over a mark", () => {
    const onActivityClick = jest.fn();
    render(
      <VotingBoard
        content={CONTENT}
        highlights
        activity={ACTIVITY}
        onActivityClick={onActivityClick}
      />
    );
    const [first] = screen.getAllByTestId("passage-activity");
    const range = document.createRange();
    range.selectNodeContents(first);
    window.getSelection()?.addRange(range);
    fireEvent.click(first);
    expect(onActivityClick).not.toHaveBeenCalled();
  });

  it("shows the linked passage instead of the marks while one is open", () => {
    render(
      <VotingBoard
        content={CONTENT}
        highlights
        activity={ACTIVITY}
        focusedComment={{ actionId: "c1", startWordIndex: 22, endWordIndex: 47 }}
      />
    );
    expect(screen.queryAllByTestId("passage-activity")).toHaveLength(0);
  });

  it("renders no marks without activity", () => {
    render(<VotingBoard content={CONTENT} highlights />);
    expect(screen.queryAllByTestId("passage-activity")).toHaveLength(0);
  });

  it("hides passage activity marks and badges when highlights is false", () => {
    const { container } = render(
      <VotingBoard content={CONTENT} highlights={false} activity={ACTIVITY} />
    );
    expect(screen.queryAllByTestId("passage-activity")).toHaveLength(0);
    // Post text remains readable
    expect(container.textContent).toContain(CONTENT);
  });

  it("renders visible linked passage when focusedComment is set and highlights is false", () => {
    const onHighlightClick = jest.fn();
    render(
      <VotingBoard
        content={CONTENT}
        highlights={false}
        activity={ACTIVITY}
        focusedComment={{ actionId: "c1", startWordIndex: 22, endWordIndex: 47 }}
        onHighlightClick={onHighlightClick}
      />
    );
    // Ambient activity marks and badges remain hidden
    expect(screen.queryAllByTestId("passage-activity")).toHaveLength(0);

    // The linked passage is a visible mark with the original linked class
    const linked = screen.getByTestId("linked-passage");
    expect(linked).toBeInTheDocument();
    expect(linked.tagName.toLowerCase()).toBe("mark");
    expect(linked).toHaveClass("qv-mark-linked");
    expect(linked).toHaveAttribute("role", "button");
    expect(linked).toHaveAttribute("tabindex", "0");
    expect(linked).toHaveAttribute("data-linked-passage", "true");
    expect(linked).toHaveTextContent("raise money for bus lanes");

    // Clicking it invokes onHighlightClick
    fireEvent.click(linked);
    expect(onHighlightClick).toHaveBeenCalledTimes(1);

    // Automatic scrolling finds the linked element
    const scrollTarget = document.querySelector("[data-linked-passage='true']");
    expect(scrollTarget).toBe(linked);
  });

  it("preserves visual linked passage and interactions when highlights is true", () => {
    const onHighlightClick = jest.fn();
    render(
      <VotingBoard
        content={CONTENT}
        highlights={true}
        activity={ACTIVITY}
        focusedComment={{ actionId: "c1", startWordIndex: 22, endWordIndex: 47 }}
        onHighlightClick={onHighlightClick}
      />
    );
    const linked = screen.getByTestId("linked-passage");
    expect(linked).toBeInTheDocument();
    expect(linked.tagName.toLowerCase()).toBe("mark");
    expect(linked).toHaveClass("qv-mark-linked");
    expect(linked).toHaveAttribute("role", "button");
    expect(linked).toHaveAttribute("tabindex", "0");

    // Clicking invokes onHighlightClick
    fireEvent.click(linked);
    expect(onHighlightClick).toHaveBeenCalledTimes(1);

    // Keyboard interaction (Enter and Space) invokes onHighlightClick
    fireEvent.keyDown(linked, { key: "Enter" });
    expect(onHighlightClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(linked, { key: " " });
    expect(onHighlightClick).toHaveBeenCalledTimes(3);
  });
});

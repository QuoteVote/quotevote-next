import {
  clampQuoteRatio,
  getActionTextRange,
  loadPersistedQuoteRatio,
  persistQuoteRatio,
  scrollChildIntoContainer,
  shouldCollapseOpenSplit,
  snapQuoteRatio,
  toLinkedPassage,
} from "@/lib/utils/discussionSplit";
import {
  DEFAULT_QUOTE_RATIO,
  MAX_QUOTE_RATIO,
  MIN_QUOTE_RATIO,
  SPLIT_RATIO_STORAGE_KEY,
} from "@/types/discussionSplit";
import type { PostAction } from "@/types/postActions";

describe("discussionSplit utils", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("clampQuoteRatio", () => {
    it("clamps below the minimum", () => {
      expect(clampQuoteRatio(0.05)).toBe(MIN_QUOTE_RATIO);
    });

    it("clamps above the maximum", () => {
      expect(clampQuoteRatio(0.95)).toBe(MAX_QUOTE_RATIO);
    });

    it("returns NaN-safe default", () => {
      expect(clampQuoteRatio(Number.NaN)).toBe(DEFAULT_QUOTE_RATIO);
    });
  });

  describe("snapQuoteRatio", () => {
    it("snaps near article focus (75/25)", () => {
      expect(snapQuoteRatio(0.73)).toBe(0.75);
    });

    it("snaps near balanced (50/50)", () => {
      expect(snapQuoteRatio(0.51)).toBe(0.5);
    });

    it("snaps near discussion focus (25/75)", () => {
      expect(snapQuoteRatio(0.27)).toBe(0.25);
    });

    it("keeps continuous values away from snap points", () => {
      expect(snapQuoteRatio(0.45)).toBe(0.45);
    });
  });

  describe("persistQuoteRatio", () => {
    it("round-trips a stored ratio", () => {
      persistQuoteRatio(0.5);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(SPLIT_RATIO_STORAGE_KEY, "0.5");
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce("0.5");
      expect(loadPersistedQuoteRatio()).toBe(0.5);
    });

    it("returns the default when a collapsed-floor ratio was stored", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce("0.8");
      expect(loadPersistedQuoteRatio()).toBe(DEFAULT_QUOTE_RATIO);
    });
  });

  describe("shouldCollapseOpenSplit", () => {
    it("collapses when the quote pane is at the open-state maximum", () => {
      expect(shouldCollapseOpenSplit(MAX_QUOTE_RATIO)).toBe(true);
      expect(shouldCollapseOpenSplit(0.95)).toBe(true);
    });

    it("keeps the split open at article-focus and default sizes", () => {
      expect(shouldCollapseOpenSplit(0.75)).toBe(false);
      expect(shouldCollapseOpenSplit(DEFAULT_QUOTE_RATIO)).toBe(false);
      expect(shouldCollapseOpenSplit(MIN_QUOTE_RATIO)).toBe(false);
    });
  });

  describe("toLinkedPassage", () => {
    it("returns a passage for comments with a text range", () => {
      const action = {
        _id: "c1",
        __typename: "Comment",
        content: "hello",
        created: "2024-01-01",
        startWordIndex: 10,
        endWordIndex: 24,
        user: { _id: "u1", username: "neo" },
      } as PostAction;

      expect(toLinkedPassage(action)).toEqual({
        actionId: "c1",
        startWordIndex: 10,
        endWordIndex: 24,
      });
    });

    it("returns null for comments without a text range", () => {
      const action = {
        _id: "c2",
        __typename: "Comment",
        content: "hello",
        created: "2024-01-01",
        user: { _id: "u1", username: "neo" },
      } as PostAction;

      expect(toLinkedPassage(action)).toBeNull();
      expect(getActionTextRange(action)).toBeNull();
    });

    it("returns a passage for votes and quotes with a text range", () => {
      const vote = {
        _id: "v1",
        __typename: "Vote",
        created: "2024-01-01",
        startWordIndex: 0,
        endWordIndex: 8,
        user: { _id: "u1", username: "neo" },
      } as PostAction;
      const quote = {
        _id: "q1",
        __typename: "Quote",
        created: "2024-01-01",
        startWordIndex: 4,
        endWordIndex: 12,
        user: { _id: "u1", username: "neo" },
      } as PostAction;

      expect(toLinkedPassage(vote)).toEqual({
        actionId: "v1",
        startWordIndex: 0,
        endWordIndex: 8,
      });
      expect(toLinkedPassage(quote)).toEqual({
        actionId: "q1",
        startWordIndex: 4,
        endWordIndex: 12,
      });
    });

    it("returns null for messages even with a range", () => {
      const action = {
        _id: "m1",
        __typename: "Message",
        text: "hello",
        userId: "u1",
        created: "2024-01-01",
        startWordIndex: 0,
        endWordIndex: 8,
        user: { _id: "u1", username: "neo" },
      } as PostAction;

      expect(toLinkedPassage(action)).toBeNull();
    });
  });

  describe("scrollChildIntoContainer", () => {
    it("scrolls the container so the child is centered", () => {
      const container = document.createElement("div");
      const child = document.createElement("div");
      container.appendChild(child);
      document.body.appendChild(container);

      jest.spyOn(container, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        height: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      jest.spyOn(child, "getBoundingClientRect").mockReturnValue({
        top: 300,
        bottom: 340,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 300,
        toJSON: () => ({}),
      });
      Object.defineProperty(container, "clientHeight", { value: 200, configurable: true });
      Object.defineProperty(container, "scrollTop", { value: 0, writable: true, configurable: true });
      const scrollTo = jest.fn();
      container.scrollTo = scrollTo;

      scrollChildIntoContainer(container, child, "center");

      expect(scrollTo).toHaveBeenCalledWith({ top: 220, behavior: "smooth" });
      container.remove();
    });

    it("does not scroll when nearest and the child is already visible", () => {
      const container = document.createElement("div");
      const child = document.createElement("div");
      container.appendChild(child);
      document.body.appendChild(container);

      jest.spyOn(container, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        height: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      jest.spyOn(child, "getBoundingClientRect").mockReturnValue({
        top: 40,
        bottom: 80,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 40,
        toJSON: () => ({}),
      });
      const scrollTo = jest.fn();
      container.scrollTo = scrollTo;

      scrollChildIntoContainer(container, child, "nearest");

      expect(scrollTo).not.toHaveBeenCalled();
      container.remove();
    });
  });
});

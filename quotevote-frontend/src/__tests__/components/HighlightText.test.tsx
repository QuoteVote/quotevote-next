/**
 * HighlightText Component Tests
 *
 * Tests that verify:
 * - Component renders correctly with different props
 * - Single and multiple highlight terms work
 * - Case sensitivity option works
 * - Auto-escape option works
 * - Empty and edge cases are handled gracefully
 * - Custom styling is applied
 * - No matches scenario works correctly
 */

import React from "react";
import { render, screen } from "../utils/test-utils";
import HighlightText from "@/components/HighlightText";

// Mock react-highlight-words to test the component behavior
jest.mock("react-highlight-words", () => {
  return {
    __esModule: true,
    default: ({
      textToHighlight,
      searchWords,
      caseSensitive,
      autoEscape,
      highlightClassName,
    }: {
      textToHighlight: string;
      searchWords: string[];
      caseSensitive?: boolean;
      autoEscape?: boolean;
      highlightClassName?: string;
    }) => {
      // Simple mock implementation that wraps matched words
      let result = textToHighlight;
      searchWords.forEach((word) => {
        const flags = caseSensitive ? "g" : "gi";
        const regex = autoEscape
          ? new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags)
          : new RegExp(word, flags);
        result = result.replace(
          regex,
          (match) => `<mark class="${highlightClassName}">${match}</mark>`
        );
      });
      return React.createElement("span", {
        dangerouslySetInnerHTML: { __html: result },
        "data-testid": "highlighter",
      });
    },
  };
});

describe("HighlightText Component", () => {
  describe("Basic Rendering", () => {
    it("renders text without crashing", () => {
      const { container } = render(<HighlightText text="Hello World" highlightTerms={[]} />);

      expect(container).toBeInTheDocument();
      expect(container.textContent).toBe("Hello World");
    });

    it("renders text when no highlight terms provided", () => {
      const { container } = render(<HighlightText text="Hello World" />);

      expect(container.textContent).toBe("Hello World");
    });

    it("renders with custom className", () => {
      const { container } = render(
        <HighlightText text="Hello World" highlightTerms={[]} className="custom-class" />
      );

      const span = container.querySelector("span");
      expect(span).toHaveClass("custom-class");
    });
  });

  describe("Single Highlight Term", () => {
    it("highlights a single term", () => {
      render(<HighlightText text="The dog is chasing the cat" highlightTerms="dog" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
      expect(highlighter.innerHTML).toContain("dog");
    });

    it("highlights multiple occurrences of a single term", () => {
      render(<HighlightText text="The dog is chasing the dog" highlightTerms="dog" />);

      const highlighter = screen.getByTestId("highlighter");
      const matches = highlighter.innerHTML.match(/<mark/g);
      expect(matches).toHaveLength(2);
    });

    it("handles empty string as highlight term", () => {
      const { container } = render(<HighlightText text="Hello World" highlightTerms="" />);

      expect(container.textContent).toBe("Hello World");
    });
  });

  describe("Multiple Highlight Terms", () => {
    it("highlights multiple terms from array", () => {
      render(
        <HighlightText
          text="The dog is chasing the cat. Or perhaps they're just playing?"
          highlightTerms={["and", "or", "the"]}
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
      expect(highlighter.innerHTML).toContain("the");
      expect(highlighter.innerHTML).toContain("Or");
    });

    it("handles empty array of highlight terms", () => {
      const { container } = render(<HighlightText text="Hello World" highlightTerms={[]} />);

      expect(container.textContent).toBe("Hello World");
    });

    it("filters out empty strings from highlight terms array", () => {
      render(<HighlightText text="Hello World" highlightTerms={["Hello", "", "  ", "World"]} />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
      expect(highlighter.innerHTML).toContain("Hello");
      expect(highlighter.innerHTML).toContain("World");
    });

    it("handles array with only empty strings", () => {
      const { container } = render(
        <HighlightText text="Hello World" highlightTerms={["", "  "]} />
      );

      expect(container.textContent).toBe("Hello World");
    });
  });

  describe("Case Sensitivity", () => {
    it("matches case-insensitively by default", () => {
      render(
        <HighlightText
          text="The dog is chasing the Dog"
          highlightTerms="dog"
          caseSensitive={false}
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      const matches = highlighter.innerHTML.match(/<mark/g);
      expect(matches).toHaveLength(2); // Both "dog" and "Dog" should match
    });

    it("matches case-sensitively when enabled", () => {
      render(
        <HighlightText
          text="The dog is chasing the Dog"
          highlightTerms="dog"
          caseSensitive={true}
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      const matches = highlighter.innerHTML.match(/<mark/g);
      expect(matches).toHaveLength(1); // Only "dog" should match
    });
  });

  describe("Auto-Escape", () => {
    it("escapes special regex characters by default", () => {
      render(
        <HighlightText text="Price: $100.00 (50% off)" highlightTerms="$100" autoEscape={true} />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter.innerHTML).toContain("$100");
    });

    it("handles special characters without escaping when autoEscape is false", () => {
      render(
        <HighlightText
          text="Test (parentheses) and [brackets]"
          highlightTerms="(parentheses)"
          autoEscape={false}
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("applies default highlight className", () => {
      render(<HighlightText text="Hello World" highlightTerms="Hello" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter.innerHTML).toContain("bg-yellow-200");
      expect(highlighter.innerHTML).toContain("font-semibold");
    });

    it("applies custom highlight className", () => {
      render(
        <HighlightText
          text="Hello World"
          highlightTerms="Hello"
          highlightClassName="bg-blue-500 text-white"
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter.innerHTML).toContain("bg-blue-500");
      expect(highlighter.innerHTML).toContain("text-white");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty text string", () => {
      render(<HighlightText text="" highlightTerms="test" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });

    it("handles text with only whitespace", () => {
      const { container } = render(<HighlightText text="   " highlightTerms="test" />);

      expect(container.textContent).toBe("   ");
    });

    it("handles text with special characters", () => {
      render(<HighlightText text="Hello! @world #hashtag $money" highlightTerms="world" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });

    it("handles text with newlines", () => {
      const { container } = render(
        <HighlightText text="Line 1\nLine 2\nLine 3" highlightTerms="Line" />
      );

      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
      expect(container.textContent).toContain("Line 3");
    });

    it("handles very long text", () => {
      const longText = "word ".repeat(1000);
      const { container } = render(<HighlightText text={longText} highlightTerms="word" />);

      expect(container.textContent).toContain("word");
    });

    it("handles unicode characters", () => {
      render(<HighlightText text="Hello 世界 🌍" highlightTerms="Hello" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });

    it("handles no matches scenario", () => {
      const { container } = render(<HighlightText text="Hello World" highlightTerms="xyz" />);

      expect(container.textContent).toBe("Hello World");
    });
  });

  describe("Component Structure", () => {
    it("wraps content in span element", () => {
      const { container } = render(<HighlightText text="Hello World" highlightTerms={[]} />);

      const span = container.querySelector("span");
      expect(span).toBeInTheDocument();
    });

    it("does not throw hydration warnings", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      render(<HighlightText text="Hello World" highlightTerms="Hello" />);

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("hydration"),
        expect.anything()
      );

      consoleError.mockRestore();
    });
  });

  describe("Real-world Scenarios", () => {
    it("highlights search terms in a sentence", () => {
      render(
        <HighlightText
          text="The dog is chasing the cat. Or perhaps they're just playing?"
          highlightTerms={["and", "or", "the"]}
        />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });

    it("highlights user search query in results", () => {
      render(<HighlightText text="John Doe - Software Engineer" highlightTerms="John" />);

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter.innerHTML).toContain("John");
    });

    it("handles multiple overlapping terms gracefully", () => {
      render(
        <HighlightText text="The quick brown fox" highlightTerms={["quick", "quick brown"]} />
      );

      const highlighter = screen.getByTestId("highlighter");
      expect(highlighter).toBeInTheDocument();
    });
  });
});

/**
 * VotingPopup component tests (issue #529: Quote / Vote selection popup)
 */

import { render, screen, fireEvent, waitFor } from "@/__tests__/utils/test-utils";
import VotingPopup from "@/components/VotingComponents/VotingPopup";
import type { VotingPopupProps } from "@/types/voting";

const selectedText = {
  startIndex: 10,
  endIndex: 42,
  text: "a single sentence worth quoting",
  points: 0,
};

function renderPopup(overrides: Partial<VotingPopupProps> = {}) {
  const props: VotingPopupProps = {
    onVote: jest.fn(),
    onQuote: jest.fn(),
    selectedText,
    userVotes: [],
    onRemoveVote: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };
  render(<VotingPopup {...props} />);
  return props;
}

const openVoteMode = () => fireEvent.click(screen.getByTestId("highlight-vote-mode-button"));

describe("VotingPopup", () => {
  it("shows Quote and Vote as the two primary actions and no Comment action", () => {
    renderPopup();

    expect(screen.getByRole("button", { name: "Quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vote" })).toBeInTheDocument();
    expect(screen.queryByTestId("highlight-comment-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /comment/i })).not.toBeInTheDocument();
  });

  it("hides the vote responses until Vote is chosen", () => {
    renderPopup();

    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("marks Vote as the active mode and reveals the three paired rows", () => {
    renderPopup();
    openVoteMode();

    const voteMode = screen.getByTestId("highlight-vote-mode-button");
    expect(voteMode).toHaveAttribute("aria-pressed", "true");
    expect(voteMode).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("highlight-quote-button")).toHaveAttribute("aria-pressed", "false");

    const options = screen.getByTestId("highlight-vote-options");
    expect(voteMode).toHaveAttribute("aria-controls", options.id);
    const labels = Array.from(options.querySelectorAll("button")).map((b) => b.textContent);
    // Positive on the left, negative on the right, row by row
    expect(labels).toEqual(["Agree", "Disagree", "True", "False", "Like", "Dislike"]);
  });

  it("collapses the vote responses when Vote is pressed again", () => {
    renderPopup();
    openVoteMode();
    openVoteMode();

    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it.each([
    ["highlight-agree-button", "up", "#agree"],
    ["highlight-disagree-button", "down", "#disagree"],
    ["highlight-true-button", "up", "#true"],
    ["highlight-false-button", "down", "#false"],
    ["highlight-like-button", "up", "#like"],
    ["highlight-dislike-button", "down", "#dislike"],
  ])("applies %s as a %s vote tagged %s and keeps the popup open", async (testId, type, tags) => {
    const props = renderPopup();
    openVoteMode();

    fireEvent.click(screen.getByTestId(testId));

    await waitFor(() => expect(props.onVote).toHaveBeenCalledWith({ type, tags }));
    expect(props.onRemoveVote).not.toHaveBeenCalled();
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it("shows every response the user holds on the passage as pressed", () => {
    renderPopup({
      userVotes: [
        { _id: "v1", type: "up", tags: "#true" },
        { _id: "v2", type: "down", tags: "#dislike" },
      ],
    });
    openVoteMode();

    expect(screen.getByTestId("highlight-true-button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("highlight-dislike-button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("highlight-agree-button")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("highlight-like-button")).toHaveAttribute("aria-pressed", "false");
  });

  it("removes only the pressed response's vote", async () => {
    const props = renderPopup({
      userVotes: [
        { _id: "v1", type: "up", tags: "#true" },
        { _id: "v2", type: "down", tags: "#dislike" },
      ],
    });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-dislike-button"));

    await waitFor(() => expect(props.onRemoveVote).toHaveBeenCalledWith("v2"));
    expect(props.onRemoveVote).toHaveBeenCalledTimes(1);
    expect(props.onVote).not.toHaveBeenCalled();
  });

  it("adds a response in another pair without removing the existing one", async () => {
    const props = renderPopup({ userVotes: [{ _id: "v1", type: "up", tags: "#true" }] });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-like-button"));

    await waitFor(() => expect(props.onVote).toHaveBeenCalledWith({ type: "up", tags: "#like" }));
    expect(props.onRemoveVote).not.toHaveBeenCalled();
  });

  it("disables the responses while a vote is being saved", async () => {
    let finish: () => void = () => {};
    const onVote = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    renderPopup({ onVote });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-true-button"));
    expect(screen.getByTestId("highlight-true-button")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("highlight-like-button")).toBeDisabled();
    fireEvent.click(screen.getByTestId("highlight-true-button"));
    expect(onVote).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(screen.getByTestId("highlight-like-button")).toBeEnabled());
  });

  it("sends the selected passage to the composer and closes the popup on Quote", () => {
    const props = renderPopup();

    fireEvent.click(screen.getByTestId("highlight-quote-button"));

    expect(props.onQuote).toHaveBeenCalledWith(selectedText);
    expect(props.onDismiss).toHaveBeenCalled();
    expect(props.onVote).not.toHaveBeenCalled();
  });

  it("keeps Quote and Vote mutually exclusive", () => {
    renderPopup({ onDismiss: undefined });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-quote-button"));

    expect(screen.getByTestId("highlight-quote-button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
  });

  it("prevents mouse presses from clearing the text selection", () => {
    renderPopup();
    const popup = screen.getByTestId("selection-popup");

    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    popup.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("is keyboard operable with native buttons", () => {
    renderPopup();

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => expect(button.tagName).toBe("BUTTON"));
    expect(screen.getByRole("group", { name: "Passage actions" })).toBeInTheDocument();
  });

  describe("redesign", () => {
    it("explains the outline under the responses, with Press on the popover", () => {
      renderPopup();
      openVoteMode();
      expect(
        screen.getByText("Your vote is outlined. Press it again to remove it.")
      ).toBeInTheDocument();
    });

    it("shows the passage and says Tap in the phone sheet", () => {
      renderPopup({ variant: "sheet" });
      expect(screen.getByText(selectedText.text)).toBeInTheDocument();
      openVoteMode();
      expect(
        screen.getByText("Your vote is outlined. Tap it again to remove it.")
      ).toBeInTheDocument();
    });

    it("keeps the passage out of the desktop popover", () => {
      renderPopup();
      expect(screen.queryByText(selectedText.text)).not.toBeInTheDocument();
    });
  });
});

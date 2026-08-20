import { render, screen, fireEvent, act } from "../../utils/test-utils";
import { ProfileBio } from "../../../components/Profile/ProfileBio";

describe("ProfileBio", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("omits the bio area when the bio is empty", () => {
    render(<ProfileBio bio="   " />);

    expect(screen.queryByTestId("profile-bio")).not.toBeInTheDocument();
  });

  it("preserves intentional line breaks", () => {
    render(<ProfileBio bio={"First line\nSecond line"} />);

    expect(screen.getByText(/First line/)).toHaveClass("whitespace-pre-wrap");
  });

  it("wraps long uninterrupted content instead of clipping it horizontally", () => {
    render(<ProfileBio bio={`https://example.com/${"long-path".repeat(30)}`} />);

    expect(screen.getByText(/https:\/\/example.com/)).toHaveClass("break-words");
  });

  it("does not show More when the bio fits", () => {
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(48);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(48);

    render(<ProfileBio bio="A short bio" />);

    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("expands and collapses a truncated bio in place", () => {
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(96);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(48);

    render(<ProfileBio bio="A long bio that takes more than three lines on a narrow screen." />);

    const moreButton = screen.getByRole("button", { name: "More" });
    const bioText = screen.getByText(/A long bio/);
    expect(moreButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(moreButton);

    expect(screen.getByRole("button", { name: "Less" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Less" })).not.toHaveClass("sm:hidden");
    expect(bioText).toHaveClass("profile-bio-text-expanded");
    expect(bioText.parentElement).toHaveClass("bg-muted/30");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Less" }));
    });

    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false");
    expect(bioText).not.toHaveClass("profile-bio-text-expanded");
  });

  it("resets expansion when the displayed bio changes", () => {
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(96);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(48);

    const { rerender } = render(<ProfileBio bio="The original long bio." />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("button", { name: "Less" })).toBeInTheDocument();

    rerender(<ProfileBio bio="A different profile bio." />);

    expect(screen.queryByRole("button", { name: "Less" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false");
  });
});

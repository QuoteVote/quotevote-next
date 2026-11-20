/**
 * Create quote in the updated design: counters, Draft saved, Cancel, the citation check
 * and the preview.
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useMutation } from "@apollo/client/react";
import { SubmitPostForm } from "@/components/SubmitPost/SubmitPostForm";
import { previewExcerpt, previewLinkLabel } from "@/components/SubmitPost/SubmitPostPreview";
import { getSubmitPostDraftKey } from "@/lib/utils/submitPostDraft";
import type { Tag } from "@/types/components";

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useApolloClient: () => ({ cache: { evict: jest.fn(), gc: jest.fn() } }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/useResponsive", () => ({ useResponsive: () => ({ isMobile: false }) }));
jest.mock("@/store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) => selector({ setSelectedPost: jest.fn() }),
}));

const user = { _id: "user-1", username: "maya" };
const transport: Tag = { _id: "tag-1", title: "Transport", privacy: "public" };

const draftOf = (values: Record<string, unknown>) =>
  JSON.stringify({ title: "", text: "", citationUrl: "", attribution: "", ...values });

const serveDraft = (draft: string | null) =>
  (sessionStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    key === getSubmitPostDraftKey(user._id) ? draft : null
  );

beforeEach(() => {
  jest.clearAllMocks();
  serveDraft(null);
  (useMutation as unknown as jest.Mock).mockReturnValue([jest.fn(), { loading: false }]);
});

describe("Create quote (updated design)", () => {
  it("counts the title and the post content against the design's limits", () => {
    render(<SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />);

    fireEvent.change(screen.getByTestId("post-title-input"), {
      target: { value: "Should the city price downtown parking?" },
    });
    expect(screen.getByTestId("post-title-input")).toHaveAttribute("maxLength", "120");
    expect(screen.getByText((_, el) => el?.textContent === "39/120")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("post-body-input"), {
      target: { value: "x".repeat(1640) },
    });
    const bodyCount = screen.getByText((_, el) => el?.textContent === "1,640/2,000");
    expect(bodyCount).toHaveAttribute("data-warn", "true");
    expect(screen.getByTestId("post-body-input")).toHaveAttribute("maxLength", "2000");
  });

  it("shows Draft saved once a non-empty draft is stored", async () => {
    jest.useFakeTimers();
    render(<SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />);
    expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("post-title-input"), { target: { value: "A title" } });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      getSubmitPostDraftKey(user._id),
      expect.stringContaining("A title")
    );
    expect(screen.getByText("Draft saved")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("keeps a saved draft when the composer opens and closes before the save delay", () => {
    jest.useFakeTimers();
    serveDraft(draftOf({ title: "Kept title", text: "Kept text" }));
    const { unmount } = render(
      <SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />
    );

    expect(screen.getByTestId("post-title-input")).toHaveValue("Kept title");
    unmount();
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("closes from Cancel and from the close button, keeping the draft", () => {
    serveDraft(draftOf({ title: "Half-written" }));
    const setOpen = jest.fn();
    render(<SubmitPostForm options={[transport]} user={user} setOpen={setOpen} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(setOpen).toHaveBeenNthCalledWith(1, false);
    expect(setOpen).toHaveBeenNthCalledWith(2, false);
    expect(sessionStorage.removeItem).not.toHaveBeenCalled();
  });

  it("keeps the close button first in the composer, for keyboard and e2e", () => {
    render(<SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />);
    const firstButton = screen.getByTestId("post-composer").querySelector("button");
    expect(firstButton).toHaveAccessibleName("Close");
  });

  it("checks a valid citation link and explains an invalid one", async () => {
    render(<SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />);
    const citation = screen.getByTestId("post-citation-input");

    expect(
      screen.getByText("Where the quote comes from. Shown under the quote.")
    ).toBeInTheDocument();
    expect(screen.getByText("A person, office or publication.")).toBeInTheDocument();

    fireEvent.change(citation, { target: { value: "https://citycouncil.gov/minutes" } });
    expect(await screen.findByRole("img", { name: "Valid link" })).toBeInTheDocument();

    fireEvent.change(citation, { target: { value: "citycouncil" } });
    expect(await screen.findByTestId("post-citation-error")).toHaveTextContent(
      "Enter a full link starting with https://"
    );
    expect(citation).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("img", { name: "Valid link" })).not.toBeInTheDocument();
  });

  it("previews the post with the tag, the source line and the author", async () => {
    serveDraft(
      draftOf({
        title: "Should the city price downtown parking?",
        text: "Downtown parking is free on weekdays after six. Charging for it would raise money for bus lanes and safer crossings. Small shops worry.",
        citationUrl: "https://www.citycouncil.gov/minutes/",
        attribution: "Mayor’s office",
        tag: transport,
      })
    );
    render(<SubmitPostForm options={[transport]} user={user} setOpen={jest.fn()} />);
    const preview = screen.getByTestId("post-preview");

    await waitFor(() => expect(preview).toHaveTextContent("# Transport"));
    expect(preview).toHaveTextContent("Should the city price downtown parking?");
    expect(preview).toHaveTextContent("— Mayor’s office · citycouncil.gov/minutes ↗");
    expect(preview).toHaveTextContent("safer crossings…");
    expect(preview).toHaveTextContent("maya· Just now");
    expect(screen.getByRole("link", { name: "citycouncil.gov/minutes ↗" })).toHaveAttribute(
      "rel",
      "noopener noreferrer nofollow"
    );
  });
});

describe("preview helpers", () => {
  it("labels a link with its host and path", () => {
    expect(previewLinkLabel("https://www.citycouncil.gov/minutes/")).toBe(
      "citycouncil.gov/minutes"
    );
    expect(previewLinkLabel("https://example.org")).toBe("example.org");
    expect(previewLinkLabel("javascript:alert(1)")).toBeNull();
  });

  it("cuts long text at a word and ends it with an ellipsis", () => {
    expect(previewExcerpt("Short text.")).toBe("Short text.");
    const cut = previewExcerpt("word ".repeat(40));
    expect(cut.endsWith("word…")).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(121);
  });
});

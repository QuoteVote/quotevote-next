/**
 * Discussion drawer on phones (#773): no summary card for the selected passage, the passage
 * is highlighted in the post instead, and closing the drawer clears that highlight.
 */

import { fireEvent, render, screen } from "@/__tests__/utils/test-utils";
import PostDetailPage from "@/app/(dashboard)/post/[group]/[title]/[postId]/PostPageContent";
import { useAppStore } from "@/store";
import type { PostAction } from "@/types/postActions";

jest.mock("next/navigation", () => ({
  useParams: () => ({ postId: "post-1" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useHasMounted: () => true,
  useIsMobile: () => true,
  useIsLandscapeMobile: () => false,
  useMediaQuery: () => true,
}));

const POST = {
  _id: "post-1",
  title: "A post",
  text: "Lunch is free or reduced for every student this year.",
  userId: "author-1",
  url: "/post/general/a-post/post-1",
  comments: [],
  votes: [],
  quotes: [],
  messageRoom: null,
};

jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useQuery: () => ({ data: { post: POST }, loading: false, refetch: jest.fn() }),
  useSubscription: jest.fn(),
}));

// The post shows the passage the store marks as linked, the way VotingBoard highlights it.
jest.mock("@/components/Post/PostController", () => ({
  __esModule: true,
  default: function MockPostController() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppStore: useStore } = require("@/store");
    const linked = useStore(
      (s: { ui: { linkedPassage: { startWordIndex: number; endWordIndex: number } | null } }) =>
        s.ui.linkedPassage
    );
    return (
      <div data-testid="post-controller">
        {linked ? (
          <mark data-testid="linked-passage">
            {POST.text.slice(linked.startWordIndex, linked.endWordIndex)}
          </mark>
        ) : null}
      </div>
    );
  },
}));

const comment = (id: string, start: number, end: number): PostAction =>
  ({
    _id: id,
    __typename: "Comment",
    content: "A reply",
    created: "2026-11-27T10:00:00.000Z",
    startWordIndex: start,
    endWordIndex: end,
    user: { _id: "u1", username: "alice", name: null, avatar: null },
  }) as unknown as PostAction;

jest.mock("@/components/PostActions/PostActionList", () => ({
  __esModule: true,
  default: ({ onSelectAction }: { onSelectAction?: (action: PostAction) => void }) => (
    <div data-testid="post-action-list">
      <button type="button" onClick={() => onSelectAction?.(comment("c1", 9, 24))}>
        First comment
      </button>
      <button type="button" onClick={() => onSelectAction?.(comment("c2", 25, 42))}>
        Second comment
      </button>
    </div>
  ),
}));
jest.mock("@/components/PostChat/PostChatSend", () => ({
  __esModule: true,
  default: () => null,
}));

afterEach(() => {
  useAppStore.getState().setLinkedPassage(null);
});

describe("Discussion drawer on phones (#773)", () => {
  it("highlights the passage in the post, with no summary card in the drawer", () => {
    render(<PostDetailPage />);
    fireEvent.click(screen.getByTestId("discussion-collapsed-bar"));
    fireEvent.click(screen.getByRole("button", { name: "First comment" }));

    expect(screen.getByTestId("linked-passage")).toHaveTextContent("free or reduced");
    expect(screen.getByRole("button", { name: "Collapse discussion" })).toBeInTheDocument();
    expect(screen.queryByTestId("selected-passage-summary")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Selected passage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show all responses" })).not.toBeInTheDocument();
  });

  it("moves the highlight when another passage is selected", () => {
    render(<PostDetailPage />);
    fireEvent.click(screen.getByTestId("discussion-collapsed-bar"));
    fireEvent.click(screen.getByRole("button", { name: "First comment" }));
    fireEvent.click(screen.getByRole("button", { name: "Second comment" }));

    expect(screen.getByTestId("linked-passage")).toHaveTextContent("for every student");
    expect(useAppStore.getState().ui.linkedPassage?.actionId).toBe("c2");
  });

  it("clears the highlight when the drawer closes", () => {
    render(<PostDetailPage />);
    fireEvent.click(screen.getByTestId("discussion-collapsed-bar"));
    fireEvent.click(screen.getByRole("button", { name: "First comment" }));
    expect(screen.getByTestId("linked-passage")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse discussion" }));

    expect(screen.queryByTestId("linked-passage")).not.toBeInTheDocument();
    expect(useAppStore.getState().ui.linkedPassage).toBeNull();
    expect(screen.getByTestId("discussion-collapsed-bar")).toBeInTheDocument();
  });
});

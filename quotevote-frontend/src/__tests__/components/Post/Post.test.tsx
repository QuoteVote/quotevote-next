/**
 * Post Component Tests
 *
 * Covers the Post detail shell: author + follow grouping, metadata row,
 * Approve/Reject actions, Save, and comment-only discussion count.
 *
 * Note: `useQuery`/`useMutation` are mocked directly, so no Apollo provider
 * is needed. (Apollo Client 4 no longer exports `MockedProvider` from
 * `@apollo/client/testing`.)
 */

import { render, within, fireEvent } from "../../utils/test-utils";
import Post from "../../../components/Post/Post";
import type { PostProps } from "@/types/post";

// Mock useRouter
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock Zustand store
const mockSetSnackbar = jest.fn();
const mockUiState = {
  linkedPassage: null as {
    actionId: string;
    startWordIndex: number;
    endWordIndex: number;
  } | null,
  mobileDiscussionOpen: false,
};
jest.mock("@/store", () => ({
  useAppStore: (
    selector?: (state: { ui: typeof mockUiState; setSnackbar: jest.Mock }) => unknown
  ) => {
    const state = {
      setSnackbar: mockSetSnackbar,
      ui: mockUiState,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock useGuestGuard
const mockGuestGuard = jest.fn(() => true);
jest.mock("@/hooks/useGuestGuard", () => ({
  __esModule: true,
  default: () => mockGuestGuard,
}));

// Mock useQuery and useMutation from Apollo Client
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

// Stub heavy child components so the Post shell renders in jsdom
jest.mock("@/components/VotingComponents/VotingBoard", () => ({
  __esModule: true,
  default: ({ content, onHighlightClick }: { content: string; onHighlightClick?: () => void }) => (
    <div data-testid="voting-board">
      {content}
      <button type="button" data-testid="linked-passage" onClick={() => onHighlightClick?.()}>
        highlight
      </button>
    </div>
  ),
}));
jest.mock("@/components/VotingComponents/VotingPopup", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/DisplayAvatar", () => ({
  DisplayAvatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-seed={username ?? ""} />
  ),
}));
jest.mock("@/components/CustomButtons/FollowButton", () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));
jest.mock("@/components/CustomButtons/BookmarkIconButton", () => ({
  BookmarkIconButton: () => (
    <button type="button" aria-label="Save post">
      Save
    </button>
  ),
}));

describe("Post Component", () => {
  const mockPost = {
    _id: "post1",
    userId: "user1",
    created: "2024-01-15T10:30:00Z",
    title: "Test Post",
    text: "This is a test post content.",
    url: "https://example.com",
    enable_voting: true,
    creator: {
      _id: "user1",
      username: "testuser",
      name: "Test User",
      avatar: "https://example.com/avatar.jpg",
    },
    votes: [],
    comments: [],
    quotes: [],
    approvedBy: [],
    rejectedBy: [],
    reportedBy: [],
  };

  const mockUser = {
    _id: "current-user",
    admin: false,
    _followingId: [],
  };

  const mockProps: PostProps = {
    post: mockPost,
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUiState.linkedPassage = null;
    mockUiState.mobileDiscussionOpen = false;
    // Default mocks
    mockUseQuery.mockReturnValue({
      data: { users: [] },
      loading: false,
      error: undefined,
    });
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }]);
  });

  describe("Basic Rendering", () => {
    it("renders the post title and action toolbar", () => {
      const { getByRole } = render(<Post {...mockProps} />);
      expect(getByRole("heading", { name: "Test Post" })).toBeInTheDocument();
      expect(getByRole("toolbar", { name: "Post actions" })).toBeInTheDocument();
    });

    it("handles missing creator gracefully", () => {
      const postWithoutCreator = {
        ...mockPost,
        creator: undefined,
      };
      const { getByRole } = render(<Post {...mockProps} post={postWithoutCreator} />);
      expect(getByRole("toolbar", { name: "Post actions" })).toBeInTheDocument();
    });

    it("does not render an OP badge", () => {
      const { queryByTestId, queryByText } = render(<Post {...mockProps} />);
      expect(queryByTestId("post-op-badge")).not.toBeInTheDocument();
      expect(queryByText("OP")).not.toBeInTheDocument();
    });

    it("groups Follow with the author identity", () => {
      const { getByRole } = render(<Post {...mockProps} />);
      const article = getByRole("article");
      const author = within(article).getByRole("button", { name: "Test User" });
      const follow = within(article).getByRole("button", { name: "Follow" });
      expect(
        author.compareDocumentPosition(follow) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("hides Follow on the author's own post", () => {
      const { queryByRole } = render(<Post {...mockProps} user={{ ...mockUser, _id: "user1" }} />);
      expect(queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
    });
  });

  describe("Post metadata", () => {
    it("renders community, source, and timestamp in a metadata row", () => {
      mockUseQuery.mockImplementation(() => ({
        data: { tag: { _id: "g1", title: "community-planning" } },
        loading: false,
        error: undefined,
      }));
      const postWithMeta = {
        ...mockPost,
        tagId: "g1",
        citationUrl: "https://www.example.com/article",
      };
      const { getByTestId } = render(<Post {...mockProps} post={postWithMeta} />);
      const meta = getByTestId("post-metadata");
      expect(meta).toHaveTextContent("community-planning");
      expect(meta).toHaveTextContent("Source: example.com");
      expect(meta.querySelector("time")).toBeInTheDocument();
    });
  });

  describe("Default avatar seed", () => {
    it("seeds the default avatar with the display name (matches profile/chat)", () => {
      const { getByTestId } = render(<Post {...mockProps} />);
      expect(getByTestId("avatar")).toHaveAttribute("data-seed", "Test User");
    });

    it("falls back to the username when the creator has no name", () => {
      const post = { ...mockPost, creator: { ...mockPost.creator, name: undefined } };
      const { getByTestId } = render(<Post {...mockProps} post={post} />);
      expect(getByTestId("avatar")).toHaveAttribute("data-seed", "testuser");
    });
  });

  describe("Discussion count indicator", () => {
    it("shows the comment count in the action bar next to Save", () => {
      const postWithInteractions = {
        ...mockPost,
        votes: [{ _id: "v1" }, { _id: "v2" }],
        comments: [{ _id: "c1", created: "2024-01-15T11:00:00Z", userId: "user2" }],
        quotes: [{ _id: "q1" }],
      };
      const { getByRole } = render(<Post {...mockProps} post={postWithInteractions} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      const indicator = within(toolbar).getByLabelText("1 comment");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent("1");
      expect(within(toolbar).getByLabelText("Save post")).toBeInTheDocument();
    });

    it("pluralizes correctly for multiple comments", () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          { _id: "c1", created: "2024-01-15T11:00:00Z", userId: "user2" },
          { _id: "c2", created: "2024-01-15T11:01:00Z", userId: "user3" },
        ],
      };
      const { getByRole } = render(<Post {...mockProps} post={postWithComments} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      expect(within(toolbar).getByLabelText("2 comments")).toBeInTheDocument();
    });

    it("shows zero comments when the post has none", () => {
      const { getByRole } = render(<Post {...mockProps} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      expect(within(toolbar).getByLabelText("0 comments")).toHaveTextContent("0");
    });

    it("opens discussion when the comment-count action is clicked", () => {
      const onOpenDiscussion = jest.fn();
      const { getByRole } = render(<Post {...mockProps} onOpenDiscussion={onOpenDiscussion} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      fireEvent.click(within(toolbar).getByTestId("post-comment-count"));
      expect(onOpenDiscussion).toHaveBeenCalledTimes(1);
    });

    it("activates the linked comment when the quote highlight is tapped", () => {
      mockUiState.linkedPassage = {
        actionId: "c1",
        startWordIndex: 0,
        endWordIndex: 4,
      };
      const onActivateLinkedComment = jest.fn();
      const { getByTestId } = render(
        <Post {...mockProps} onActivateLinkedComment={onActivateLinkedComment} />
      );
      fireEvent.click(getByTestId("linked-passage"));
      expect(onActivateLinkedComment).toHaveBeenCalledWith("c1");
    });
  });

  describe("Whole-post judgment", () => {
    it("renders Approve and Reject with counts inside the buttons", () => {
      const postWithVotes = {
        ...mockPost,
        approvedBy: ["a1", "a2", "a3"],
        rejectedBy: ["r1"],
      };
      const { getByRole } = render(<Post {...mockProps} post={postWithVotes} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      expect(within(toolbar).getByRole("button", { name: "Approve this post" })).toHaveTextContent(
        "3"
      );
      expect(within(toolbar).getByRole("button", { name: "Reject this post" })).toHaveTextContent(
        "1"
      );
      expect(within(toolbar).queryByLabelText(/support/i)).not.toBeInTheDocument();
    });

    it("defaults to 0 on both judgment buttons when there are no votes", () => {
      const { getByRole } = render(<Post {...mockProps} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      expect(within(toolbar).getByRole("button", { name: "Approve this post" })).toHaveTextContent(
        "0"
      );
      expect(within(toolbar).getByRole("button", { name: "Reject this post" })).toHaveTextContent(
        "0"
      );
    });

    it("places the overflow menu in the action bar and keeps Delete out of the toolbar", () => {
      const { getByRole } = render(<Post {...mockProps} user={{ ...mockUser, _id: "user1" }} />);
      const toolbar = getByRole("toolbar", { name: "Post actions" });
      expect(within(toolbar).getByLabelText("More options")).toBeInTheDocument();
      expect(
        within(toolbar).queryByRole("button", { name: "Delete post" })
      ).not.toBeInTheDocument();
    });
  });

  it("no longer renders a separate bottom stats bar", () => {
    const { queryByText } = render(<Post {...mockProps} />);
    // The old bottom bar rendered the literal word "interactions" as text;
    // the action-bar indicator only exposes it via aria-label/tooltip.
    expect(queryByText(/interactions?$/)).not.toBeInTheDocument();
  });

  describe("RC1-017: Suppress redundant vote indicator", () => {
    it('does not render "You upvoted/downvoted this post" banner after voting', () => {
      const postWithUserVote = {
        ...mockPost,
        votes: [{ _id: "v1", userId: "current-user", type: "up" }],
      };
      const { queryByText } = render(<Post {...mockProps} post={postWithUserVote} />);
      expect(queryByText(/You upvoted this post/i)).not.toBeInTheDocument();
      expect(queryByText(/You downvoted this post/i)).not.toBeInTheDocument();
    });
  });
});

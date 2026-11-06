/**
 * Post detail page (#532): a deleted or missing post shows one explanatory state,
 * without an empty discussion pane next to it.
 */

import { render, screen } from "@/__tests__/utils/test-utils";
import PostDetailPage from "@/app/(dashboard)/post/[group]/[title]/[postId]/PostPageContent";
import { GET_POST } from "@/graphql/queries";

let mockSearch = "deleted=1";
jest.mock("next/navigation", () => ({
  useParams: () => ({ postId: "gone-post-id" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useHasMounted: () => true,
  useIsMobile: () => false,
  useIsLandscapeMobile: () => false,
  useMediaQuery: () => false,
}));
jest.mock("@/components/Post/PostController", () => ({
  __esModule: true,
  default: () => <div data-testid="post-controller" />,
}));
jest.mock("@/components/PostActions/PostActionList", () => ({
  __esModule: true,
  default: () => <div data-testid="post-action-list" />,
}));
jest.mock("@/components/PostChat/PostChatSend", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));

const nullPost = [
  {
    request: { query: GET_POST, variables: { postId: "gone-post-id" } },
    result: { data: { post: null } },
    maxUsageCount: 5,
  },
];

describe("Post detail page for a missing post (#532)", () => {
  it("shows the deleted state from a notification link and no discussion pane", async () => {
    mockSearch = "deleted=1";
    render(<PostDetailPage />, { mocks: nullPost });

    expect(await screen.findByText("This post has been deleted.")).toBeInTheDocument();
    expect(screen.queryByText(/Discussion ·/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("post-action-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("post-controller")).not.toBeInTheDocument();
  });

  it("shows the neutral state for any other missing post", async () => {
    mockSearch = "";
    render(<PostDetailPage />, { mocks: nullPost });

    expect(await screen.findByText("This post isn’t available.")).toBeInTheDocument();
  });
});

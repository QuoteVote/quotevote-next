import { fireEvent, render, resetStore, screen } from "@/__tests__/utils/test-utils";
import { HomeHighlights } from "@/components/Home/HomeHighlights";
import { GET_FEATURED_POSTS, GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/DisplayAvatar", () => ({
  DisplayAvatar: () => <span data-testid="avatar" />,
}));

const featured = {
  _id: "f1",
  userId: "u1",
  tagId: "t1",
  title: "Turning empty offices into homes",
  text: "text",
  upvotes: 128,
  downvotes: 9,
  approvedBy: [],
  rejectedBy: [],
  bookmarkedBy: [],
  created: "2026-11-01T00:00:00.000Z",
  url: "/post/t/offices/f1",
  citationUrl: null,
  creator: { name: "Ana", username: "ana", avatar: null, _id: "u1", contributorBadge: false },
  votes: [],
  comments: [{ _id: "c1" }, { _id: "c2" }],
  quotes: [],
  messageRoom: null,
};

const notification = {
  _id: "n1",
  userId: "me",
  userIdBy: "lena-id",
  userBy: {
    _id: "lena-id",
    name: "Lena Torres",
    avatar: null,
    username: "lena",
    contributorBadge: false,
  },
  label: "Good point",
  status: "new",
  created: "2026-11-10T10:00:00.000Z",
  notificationType: "COMMENTED",
  post: {
    _id: "p1",
    title: "Night buses after the stadium closes",
    url: "/post/t/night/p1",
    deleted: false,
  },
};

function mocks(notifications: unknown[]) {
  return [
    {
      request: { query: GET_FEATURED_POSTS, variables: { limit: 3, offset: 0 } },
      result: {
        data: {
          featuredPosts: {
            entities: [featured],
            pagination: { total_count: 1, limit: 3, offset: 0 },
          },
        },
      },
    },
    {
      request: { query: GET_NOTIFICATIONS },
      result: { data: { notifications } },
    },
  ];
}

describe("HomeHighlights", () => {
  beforeEach(() => resetStore());

  it("shows featured posts with their votes and comments", async () => {
    render(<HomeHighlights />, { mocks: mocks([]) });
    const link = await screen.findByRole("link", { name: /Turning empty offices into homes/ });
    expect(link).toHaveAttribute("href", "/post/t/offices/f1");
    expect(link).toHaveTextContent("Up votes:128");
    expect(link).toHaveTextContent("Down votes:9");
    expect(link).toHaveTextContent("2 comments");
  });

  it("lists your posts with new comments", async () => {
    render(<HomeHighlights />, { mocks: mocks([notification]) });
    const row = await screen.findByRole("link", { name: /Night buses after the stadium closes/ });
    expect(row).toHaveAttribute("href", "/post/t/night/p1");
    expect(row).toHaveTextContent("Lena Torres commented");
    expect(row).toHaveTextContent("1 new");
  });

  it("explains the empty state", async () => {
    render(<HomeHighlights />, { mocks: mocks([]) });
    expect(
      await screen.findByText("When people comment on or quote your posts, they show up here.")
    ).toBeInTheDocument();
  });

  it("opens the notifications panel from See all", () => {
    render(<HomeHighlights />, { mocks: mocks([]) });
    fireEvent.click(screen.getByRole("button", { name: "See all" }));
    expect(useAppStore.getState().ui.notificationsOpen).toBe(true);
  });
});

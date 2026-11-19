import { render, screen } from "@/__tests__/utils/test-utils";
import { ProfileActivityCard, activityDate } from "@/components/Activity/ProfileActivityCard";
import { GET_TAG } from "@/graphql/queries";
import type { ActivityPost } from "@/types/activity";

const post: ActivityPost = {
  _id: "p1",
  tagId: "t1",
  title: "Should the city price downtown parking?",
  text: "Downtown parking is free after six.",
  url: "/post/transport/should/p1",
  upvotes: 0,
  downvotes: 0,
  comments: Array.from({ length: 11 }, (_, i) => ({ _id: `c${i}` })),
  approvedBy: Array.from({ length: 5 }, (_, i) => `a${i}`),
  rejectedBy: ["r1"],
  bookmarkedBy: [],
  created: "2026-11-10T10:00:00.000Z",
};

const tagMock = {
  request: { query: GET_TAG, variables: { tagId: "t1" } },
  result: { data: { tag: { _id: "t1", title: "Transport" } } },
};

const card = (type: string, extra: Partial<Parameters<typeof ProfileActivityCard>[0]> = {}) =>
  render(
    <ProfileActivityCard
      type={type}
      post={post}
      created={post.created}
      passage="free after six"
      href="/post/p1"
      {...extra}
    />,
    { mocks: [tagMock] }
  );

describe("ProfileActivityCard (redesign)", () => {
  it("shows a post with its topic, approval and comments", async () => {
    card("POSTED");
    const article = screen.getByRole("article", {
      name: "posted: Should the city price downtown parking?",
    });
    // Posts use the default blue light; the other kinds set their own.
    expect(article).not.toHaveAttribute("data-light");
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(await screen.findByText("# Transport")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Should the city price downtown parking?" })
    ).toHaveAttribute("href", "/post/p1");
    expect(article).toHaveTextContent("83% approve · 11 comments");
  });

  it.each([
    ["UPVOTED", "↑ Upvoted", "up", "in"],
    ["DOWNVOTED", "↓ Downvoted", "down", "in"],
    ["QUOTED", "“ Quoted", "quote", "in"],
    ["LIKED", "♥ Liked", "like", "in"],
  ])(
    "%s shows the quoted words, lit and filled, with the post it was in",
    (type, tag, light, prep) => {
      card(type);
      const article = screen.getByRole("article");
      expect(screen.getByText(tag)).toBeInTheDocument();
      expect(article).toHaveAttribute("data-light", light);
      expect(article).toHaveAttribute("data-fill", "true");
      expect(article).toHaveTextContent("“free after six”");
      expect(article).toHaveTextContent(`${prep} Should the city price downtown parking?`);
    }
  );

  it("shows the comment itself, on the post", () => {
    card("COMMENTED", { commentText: "Crossings near the school come first." });
    const article = screen.getByRole("article");
    expect(screen.getByText("Crossings near the school come first.")).toBeInTheDocument();
    expect(article).toHaveTextContent("on Should the city price downtown parking?");
  });

  it("says a post has no votes yet instead of 0%", () => {
    card("POSTED", { post: { ...post, approvedBy: [], rejectedBy: [] } });
    expect(screen.getByRole("article")).toHaveTextContent("No votes yet");
  });

  it("dates items Today, Yesterday, then by day", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 864e5);
    expect(activityDate(now.toISOString())).toBe("Today");
    expect(activityDate(yesterday.toISOString())).toBe("Yesterday");
    expect(activityDate("2020-03-09T12:00:00")).toBe("Mar 9, 2020");
  });
});

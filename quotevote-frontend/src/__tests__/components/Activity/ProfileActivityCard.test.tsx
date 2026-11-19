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
  upvotes: 24,
  downvotes: 5,
  comments: Array.from({ length: 11 }, (_, i) => ({ _id: `c${i}` })),
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
  it("shows a post as a post card with its topic, up and down votes and comments", async () => {
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
    expect(article).toHaveClass("qv-postcard");
    expect(article).toHaveTextContent("Up votes: 24");
    expect(article).toHaveTextContent("Down votes: 5");
    expect(article).toHaveTextContent("11 comments");
    expect(article).not.toHaveTextContent("%");
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

  it("shows zero votes as 0, not a percentage", () => {
    card("POSTED", { post: { ...post, upvotes: 0, downvotes: 0 } });
    const article = screen.getByRole("article");
    expect(article).toHaveTextContent("Up votes: 0");
    expect(article).toHaveTextContent("Down votes: 0");
  });

  it("keeps the lit card for the other kinds", () => {
    card("UPVOTED");
    expect(screen.getByRole("article")).toHaveClass("qv-lit");
  });

  it("dates items Today, Yesterday, then by day", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 864e5);
    expect(activityDate(now.toISOString())).toBe("Today");
    expect(activityDate(yesterday.toISOString())).toBe("Yesterday");
    expect(activityDate("2020-03-09T12:00:00")).toBe("Mar 9, 2020");
  });
});

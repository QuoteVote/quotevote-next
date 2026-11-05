/**
 * Featured post card on the landing page: a post's score is its Approve and Reject
 * counts, so passage votes don't show up as the post's thumbs up and down (#542).
 */

import { render, screen } from "../utils/test-utils";
import { FeaturedPostCard } from "@/app/components/LandingPage/LandingPageContent";
import type { Post } from "@/types/post";

const post = {
  _id: "60d5ec49ad414d7a8d5464c2",
  userId: "60d5ec49ad414d7a8d546499",
  title: "A featured post",
  text: "Some text worth reading.",
  url: "/post/featured/a-featured-post/60d5ec49ad414d7a8d5464c2",
  created: "2026-11-01T00:00:00.000Z",
  upvotes: 9,
  downvotes: 7,
  approvedBy: ["a", "b", "c"],
  rejectedBy: ["d"],
  comments: [],
  quotes: [],
  creator: { _id: "60d5ec49ad414d7a8d546499", name: "Alice", username: "alice" },
} as unknown as Post;

describe("FeaturedPostCard", () => {
  it("shows the Approve and Reject counts, not the passage vote totals", () => {
    render(<FeaturedPostCard post={post} timeAgo="4d ago" />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("9")).not.toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });

  it("shows zero for a post nobody has approved or rejected", () => {
    render(
      <FeaturedPostCard
        post={{ ...post, approvedBy: undefined, rejectedBy: [] } as Post}
        timeAgo="4d ago"
      />
    );

    // Approvals, rejections, comments and quotes are all zero.
    expect(screen.getAllByText("0")).toHaveLength(4);
  });
});

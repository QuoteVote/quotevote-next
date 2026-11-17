import { passageTone } from "@/components/VotingComponents/VotingBoard";
import type { PassageActivitySegment } from "@/types/voting";

const segment = (upvotes: number, downvotes: number): PassageActivitySegment => ({
  start: 0,
  end: 5,
  upvotes,
  downvotes,
  quotes: 0,
  comments: 1,
  actionIds: ["a"],
});

describe("passageTone", () => {
  it("is green when more votes are up", () => {
    expect(passageTone(segment(3, 1))).toBe("up");
  });

  it("is red when more votes are down", () => {
    expect(passageTone(segment(1, 2))).toBe("down");
  });

  it("is neutral for a tie or comments and quotes only", () => {
    expect(passageTone(segment(2, 2))).toBe("neutral");
    expect(passageTone(segment(0, 0))).toBe("neutral");
    expect(passageTone(undefined)).toBe("neutral");
  });
});

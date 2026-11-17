import { summarizePassage } from "@/lib/utils/passageSummary";
import type { PostAction } from "@/types/postActions";

const text = "Downtown parking is free. Charging for it would raise money for bus lanes.";
const start = text.indexOf("raise money");
const end = start + "raise money for bus lanes".length;
const passage = { actionId: "v1", startWordIndex: start, endWordIndex: end };

const action = (
  id: string,
  typename: PostAction["__typename"],
  range: [number, number] | null,
  extra: Record<string, unknown> = {}
): PostAction =>
  ({
    _id: id,
    __typename: typename,
    created: "2026-11-10T00:00:00Z",
    user: { _id: "u", username: "u" },
    content: "",
    ...(range ? { startWordIndex: range[0], endWordIndex: range[1] } : {}),
    ...extra,
  }) as unknown as PostAction;

describe("summarizePassage", () => {
  it("counts responses that overlap the passage, leaving out messages", () => {
    const summary = summarizePassage(text, passage, [
      action("v1", "Vote", [start, end], { type: "up", tags: "#agree" }),
      action("c1", "Comment", [start + 6, end + 3]),
      action("q1", "Quote", [0, 8]),
      action("m1", "Message", null),
    ]);
    expect(summary?.text).toBe("raise money for bus lanes");
    expect(summary?.responses).toBe(2);
  });

  it("counts votes per response, each pair together, only those with votes", () => {
    const summary = summarizePassage(text, passage, [
      action("v1", "Vote", [start, end], { type: "down", tags: "#false" }),
      action("v2", "Vote", [start, end], { type: "up", tags: "#true" }),
      action("v3", "Vote", [start + 2, end - 2], { type: "up", tags: "#true" }),
      action("v4", "Vote", [start, end], { type: "up", tags: "#agree" }),
      action("v5", "Vote", [start, end], { type: "down", tags: ["#dislike"] }),
    ]);
    expect(summary?.votes).toEqual([
      { key: "#agree", label: "agree", count: 1, direction: "up" },
      { key: "#true", label: "true", count: 2, direction: "up" },
      { key: "#false", label: "false", count: 1, direction: "down" },
      { key: "#dislike", label: "dislike", count: 1, direction: "down" },
    ]);
    expect(summary?.responses).toBe(5);
  });

  it("counts votes without a known response as plain up and down votes", () => {
    const summary = summarizePassage(text, passage, [
      action("v1", "Vote", [start, end], { type: "upvote", tags: null }),
      action("v2", "Vote", [start, end], { type: "up", tags: "#unknown" }),
      action("v3", "Vote", [start, end], { type: "down" }),
      action("v4", "Vote", [start, end], { type: "up", tags: "#Like" }),
    ]);
    expect(summary?.votes).toEqual([
      { key: "#like", label: "like", count: 1, direction: "up" },
      { key: "up", label: "upvotes", count: 2, direction: "up" },
      { key: "down", label: "downvote", count: 1, direction: "down" },
    ]);
  });

  it("has no vote counts when the passage has no votes", () => {
    const summary = summarizePassage(text, passage, [action("c1", "Comment", [start, end])]);
    expect(summary?.votes).toEqual([]);
    expect(summary?.responses).toBe(1);
  });

  it("returns nothing without a usable passage", () => {
    expect(summarizePassage(text, null, [])).toBeNull();
    expect(summarizePassage(text, { ...passage, endWordIndex: start }, [])).toBeNull();
    expect(summarizePassage(text, { ...passage, endWordIndex: 9999 }, [])).toBeNull();
    expect(summarizePassage("", passage, [])).toBeNull();
  });
});

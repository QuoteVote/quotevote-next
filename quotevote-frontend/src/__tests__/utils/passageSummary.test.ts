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
  it("counts votes and responses that overlap the passage", () => {
    const summary = summarizePassage(text, passage, [
      action("v1", "Vote", [start, end], { type: "up" }),
      action("v2", "Vote", [start + 2, end - 2], { type: "upvote" }),
      action("v3", "Vote", [start, end], { type: "down" }),
      action("c1", "Comment", [start + 6, end + 3]),
      action("q1", "Quote", [0, 8]),
      action("m1", "Message", null),
    ]);
    expect(summary).toEqual({
      text: "raise money for bus lanes",
      agree: 2,
      disagree: 1,
      responses: 4,
    });
  });

  it("returns nothing without a usable passage", () => {
    expect(summarizePassage(text, null, [])).toBeNull();
    expect(summarizePassage(text, { ...passage, endWordIndex: start }, [])).toBeNull();
    expect(summarizePassage(text, { ...passage, endWordIndex: 9999 }, [])).toBeNull();
    expect(summarizePassage("", passage, [])).toBeNull();
  });
});

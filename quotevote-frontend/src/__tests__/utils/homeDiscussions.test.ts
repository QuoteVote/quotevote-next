import { buildDiscussions, describeDiscussion, safePostPath } from "@/lib/utils/homeDiscussions";
import { QUICK_RANGES, quickRangeDates, toLocalIsoDate } from "@/lib/utils/homeDates";
import type { Notification } from "@/types/notification";

function note(
  id: string,
  overrides: Partial<Notification> & { by?: string; postId?: string; title?: string }
): Notification {
  const by = overrides.by ?? "bob";
  const postId = overrides.postId ?? "p1";
  return {
    _id: id,
    userId: "me",
    userBy: { _id: `${by}-id`, name: by.toUpperCase(), username: by },
    label: "",
    status: "new",
    created: "2026-11-10T10:00:00.000Z",
    notificationType: "COMMENTED",
    post: { _id: postId, title: overrides.title ?? "Night buses", url: `/post/t/x/${postId}` },
    ...overrides,
  };
}

describe("buildDiscussions", () => {
  it("groups comments by post, counts the unread ones and names who replied", () => {
    const rows = buildDiscussions([
      note("1", { by: "lena", created: "2026-11-10T12:00:00.000Z" }),
      note("2", { by: "jonah", status: "read", created: "2026-11-10T11:00:00.000Z" }),
      note("3", { by: "lena", created: "2026-11-10T10:00:00.000Z" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ postId: "p1", title: "Night buses", newCount: 2 });
    expect(rows[0].actors.map((a) => a.username)).toEqual(["lena", "jonah"]);
    expect(describeDiscussion(rows[0])).toBe("LENA and 1 other commented");
  });

  it("puts the post with the newest activity first and stops at the limit", () => {
    const rows = buildDiscussions(
      [
        note("1", { postId: "a", created: "2026-11-01T00:00:00.000Z" }),
        note("2", { postId: "b", created: "2026-11-03T00:00:00.000Z" }),
        note("3", { postId: "c", created: "2026-11-02T00:00:00.000Z" }),
      ],
      2
    );
    expect(rows.map((r) => r.postId)).toEqual(["b", "c"]);
  });

  it("leaves out follows, votes, deleted posts and unsafe links", () => {
    const rows = buildDiscussions([
      note("1", { notificationType: "FOLLOW" }),
      note("2", { notificationType: "UPVOTED" }),
      note("3", { post: { _id: "p2", url: "/post/a/b/p2", deleted: true } }),
      note("4", { post: { _id: "p3", url: "javascript:alert(1)" } }),
    ]);
    expect(rows).toEqual([]);
  });

  it("describes quotes", () => {
    const [row] = buildDiscussions([note("1", { notificationType: "QUOTED", by: "sam" })]);
    expect(describeDiscussion(row)).toBe("SAM quoted your post");
  });
});

describe("safePostPath", () => {
  it("keeps same-site paths only", () => {
    expect(safePostPath("/post/a/b/1")).toBe("/post/a/b/1");
    expect(safePostPath("//evil.example/x")).toBeNull();
    expect(safePostPath("https://evil.example/x")).toBeNull();
    expect(safePostPath(null)).toBeNull();
  });
});

describe("home date ranges", () => {
  it("ends quick ranges today", () => {
    const now = new Date(2026, 10, 12);
    const week = QUICK_RANGES.find((r) => r.key === "week")!;
    expect(quickRangeDates(week, now)).toEqual({ from: "2026-11-05", to: "2026-11-12" });
    expect(toLocalIsoDate(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});

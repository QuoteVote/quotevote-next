import { dayLabel, groupByDay } from "@/lib/utils/postDayGroups";

const now = new Date(2026, 10, 12, 15, 0);

describe("dayLabel", () => {
  it("names today, yesterday and the rest of the week", () => {
    expect(dayLabel(new Date(2026, 10, 12, 9, 0).toISOString(), now)).toBe("Today");
    expect(dayLabel(new Date(2026, 10, 11, 23, 0).toISOString(), now)).toBe("Yesterday");
    expect(dayLabel(new Date(2026, 10, 9, 12, 0).toISOString(), now)).toBe("Monday");
  });

  it("uses a short date for older posts and adds the year when it differs", () => {
    expect(dayLabel(new Date(2026, 9, 3, 12, 0).toISOString(), now)).toBe("Oct 3");
    expect(dayLabel(new Date(2025, 9, 3, 12, 0).toISOString(), now)).toBe("Oct 3, 2025");
  });

  it("returns nothing for a date it can't read", () => {
    expect(dayLabel("not a date", now)).toBe("");
  });
});

describe("groupByDay", () => {
  it("keeps the order and starts a group when the day changes", () => {
    const posts = [
      { id: "a", created: new Date(2026, 10, 12, 14, 0).toISOString() },
      { id: "b", created: new Date(2026, 10, 12, 9, 0).toISOString() },
      { id: "c", created: new Date(2026, 10, 11, 18, 0).toISOString() },
    ];
    expect(groupByDay(posts, now).map((g) => [g.label, g.posts.map((p) => p.id)])).toEqual([
      ["Today", ["a", "b"]],
      ["Yesterday", ["c"]],
    ]);
  });
});

import { getTagIdParam } from "@/lib/utils/tagParam";

describe("getTagIdParam (#539)", () => {
  it("reads the tag parameter", () => {
    expect(getTagIdParam(new URLSearchParams("tag=t1&q=x"))).toBe("t1");
  });

  it("falls back to the group parameter from older links", () => {
    expect(getTagIdParam(new URLSearchParams("group=g1"))).toBe("g1");
  });

  it("prefers tag when both are present", () => {
    expect(getTagIdParam(new URLSearchParams("group=g1&tag=t1"))).toBe("t1");
  });

  it("returns an empty string without a tag filter", () => {
    expect(getTagIdParam(new URLSearchParams("q=climate"))).toBe("");
  });
});

import { AVATAR_ROUTE, buildAvatarUrl, getDefaultAvatar, parseAvatarToUrl } from "@/lib/avatar";

const legacy =
  "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBun&skinColor=Brown&eyeType=Wink";

describe("buildAvatarUrl (#722)", () => {
  it("points at our own route, never avataaars.io", () => {
    const url = buildAvatarUrl(getDefaultAvatar("maya"));
    expect(url.startsWith(`${AVATAR_ROUTE}?avatarStyle=Circle&`)).toBe(true);
    expect(url).not.toContain("avataaars.io");
  });

  it("orders the keys, so the same avatar always has the same URL", () => {
    expect(buildAvatarUrl({ skinColor: "Brown", topType: "LongHairBun" })).toBe(
      buildAvatarUrl({ topType: "LongHairBun", skinColor: "Brown" })
    );
    expect(buildAvatarUrl({ topType: "Hat" }, "Transparent")).toBe(
      "/api/avatar?avatarStyle=Transparent&topType=Hat"
    );
  });
});

describe("parseAvatarToUrl (#722)", () => {
  it("rebuilds a stored avataaars.io URL from its options", () => {
    expect(parseAvatarToUrl(legacy)).toBe(
      "/api/avatar?avatarStyle=Circle&topType=LongHairBun&eyeType=Wink&skinColor=Brown"
    );
    expect(parseAvatarToUrl({ url: legacy })).toBe(parseAvatarToUrl(legacy));
  });

  it("drops options avataaars.io had that we don't know", () => {
    expect(
      parseAvatarToUrl("https://avataaars.io/?topType=LongHairBun&skinColor=Green&x=<b>")
    ).toBe("/api/avatar?avatarStyle=Circle&topType=LongHairBun");
  });

  it("gives nothing for an avataaars.io URL it can't read, so callers show the default", () => {
    expect(parseAvatarToUrl("https://avataaars.io/")).toBeUndefined();
    expect(parseAvatarToUrl("https://avataaars.io/?topType=Nope")).toBeUndefined();
    expect(parseAvatarToUrl({ url: "https://www.avataaars.io/png" })).toBeUndefined();
  });

  it("renders stored qualities first-party", () => {
    expect(parseAvatarToUrl({ topType: "Hat", eyeType: "Happy" })).toBe(
      "/api/avatar?avatarStyle=Circle&topType=Hat&eyeType=Happy"
    );
    expect(parseAvatarToUrl(JSON.stringify({ topType: "Hat" }))).toBe(
      "/api/avatar?avatarStyle=Circle&topType=Hat"
    );
  });

  it("keeps other image URLs and ignores look-alike hosts", () => {
    expect(parseAvatarToUrl("https://example.com/me.png")).toBe("https://example.com/me.png");
    expect(parseAvatarToUrl("https://avataaars.io.evil.test/?topType=Hat")).toBe(
      "https://avataaars.io.evil.test/?topType=Hat"
    );
  });
});

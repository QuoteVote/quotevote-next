/**
 * @jest-environment node
 */
import type { Metadata } from "next";
import { getPostForMetadata, getSitemapPosts, getUserForMetadata } from "@/lib/seo/serverData";
import { generateMetadata as generatePostMetadata } from "@/app/(dashboard)/post/[group]/[title]/[postId]/page";
import { generateMetadata as generateProfileMetadata } from "@/app/(dashboard)/profile/[username]/page";
import { generateMetadata as generateFollowersMetadata } from "@/app/(dashboard)/profile/[username]/followers/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

jest.mock("@/lib/seo/serverData", () => ({
  getPostForMetadata: jest.fn(),
  getUserForMetadata: jest.fn(),
  getSitemapPosts: jest.fn(),
}));
jest.mock("@/app/(dashboard)/post/[group]/[title]/[postId]/PostPageContent", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(dashboard)/profile/[username]/ProfileUsernamePageContent", () => ({
  ProfileUsernamePage: () => null,
}));
jest.mock("@/components/Profile/FollowInfo", () => ({ FollowInfo: () => null }));

const mockedGetPost = getPostForMetadata as jest.MockedFunction<typeof getPostForMetadata>;
const mockedGetUser = getUserForMetadata as jest.MockedFunction<typeof getUserForMetadata>;
const mockedGetSitemapPosts = getSitemapPosts as jest.MockedFunction<typeof getSitemapPosts>;

const postParams = (postId = "abc123") =>
  Promise.resolve({ group: "general", title: "hello-world", postId });

describe("post generateMetadata", () => {
  it("uses the post title, text excerpt, canonical url and published time", async () => {
    mockedGetPost.mockResolvedValueOnce({
      _id: "abc123",
      title: "Why local news matters",
      text: "Local reporting   keeps communities informed.\nIt also holds power to account.",
      url: "/post/general/why-local-news-matters/abc123",
      created: "1767225600000",
      creator: { name: "Jane", username: "jane" },
    });

    const metadata: Metadata = await generatePostMetadata({ params: postParams() });

    expect(mockedGetPost).toHaveBeenCalledWith("abc123");
    expect(metadata.title).toBe("Why local news matters — Quote.Vote");
    expect(metadata.description).toBe(
      "Local reporting keeps communities informed. It also holds power to account."
    );
    expect(metadata.alternates?.canonical).toBe("/post/general/why-local-news-matters/abc123");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/post/general/why-local-news-matters/abc123",
      publishedTime: "2026-01-01T00:00:00.000Z",
    });
  });

  it("marks a missing or deleted post noindex", async () => {
    mockedGetPost.mockResolvedValueOnce(null);

    const metadata = await generatePostMetadata({ params: postParams("missing") });

    expect(metadata.title).toBe("Post — Quote.Vote");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps the generic fallback indexable when the API is unreachable", async () => {
    mockedGetPost.mockResolvedValueOnce(undefined);

    const metadata = await generatePostMetadata({ params: postParams("outage") });

    expect(metadata.title).toBe("Post — Quote.Vote");
    expect(metadata.description).toMatch(/join the discussion/i);
    expect(metadata.alternates?.canonical).toBe("/post/general/hello-world/outage");
    expect(metadata.robots).toBeUndefined();
  });

  it("describes posts without text by author", async () => {
    mockedGetPost.mockResolvedValueOnce({
      _id: "abc123",
      title: "Untitled thought",
      text: "   ",
      creator: { username: "jane" },
    });

    const metadata = await generatePostMetadata({ params: postParams() });

    expect(metadata.description).toBe("A post by @jane on Quote.Vote.");
  });
});

describe("profile generateMetadata", () => {
  it("uses the display name and handle", async () => {
    mockedGetUser.mockResolvedValueOnce({ _id: "u1", name: "Jane Doe", username: "jane" });

    const metadata = await generateProfileMetadata({
      params: Promise.resolve({ username: "jane" }),
    });

    expect(metadata.title).toBe("Jane Doe (@jane) — Quote.Vote");
    expect(metadata.description).toBe(
      "See Jane Doe (@jane)'s posts, quotes and votes on Quote.Vote."
    );
    expect(metadata.alternates?.canonical).toBe("/profile/jane");
    expect(metadata.openGraph).toMatchObject({ type: "profile", url: "/profile/jane" });
    expect(metadata.robots).toBeUndefined();
  });

  it("marks an unknown username noindex", async () => {
    mockedGetUser.mockResolvedValueOnce(null);

    const metadata = await generateProfileMetadata({
      params: Promise.resolve({ username: "nobody" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("falls back to the decoded username and stays indexable when the API is unreachable", async () => {
    mockedGetUser.mockResolvedValueOnce(undefined);

    const metadata = await generateProfileMetadata({
      params: Promise.resolve({ username: "jane%2Edoe" }),
    });

    expect(mockedGetUser).toHaveBeenLastCalledWith("jane.doe");
    expect(metadata.title).toBe("@jane.doe — Quote.Vote");
    expect(metadata.alternates?.canonical).toBe("/profile/jane.doe");
    expect(metadata.robots).toBeUndefined();
  });

  it("gives follower lists their own title and canonical url", async () => {
    const metadata = await generateFollowersMetadata({
      params: Promise.resolve({ username: "jane" }),
    });

    expect(metadata.title).toBe("Followers · @jane — Quote.Vote");
    expect(metadata.alternates?.canonical).toBe("/profile/jane/followers");
  });
});

describe("robots and sitemap", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://next.quote.vote";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("points robots.txt at this site's sitemap and blocks private areas", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://next.quote.vote/sitemap.xml");
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(JSON.stringify(result.rules)).toContain("/settings");
  });

  it("lists static pages, public posts and their authors' profiles once each", async () => {
    mockedGetSitemapPosts.mockResolvedValueOnce([
      { url: "/post/general/a/1", created: "1767225600000", creator: { username: "jane" } },
      { url: "/post/general/b/2?", created: null, creator: { username: "jane" } },
      { url: "/post/general/a/1", created: null, creator: { username: "sam" } },
      { url: "https://elsewhere.example/x", creator: null },
    ]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://next.quote.vote/");
    expect(urls).toContain("https://next.quote.vote/about");
    expect(urls.filter((u) => u === "https://next.quote.vote/post/general/a/1")).toHaveLength(1);
    expect(urls).toContain("https://next.quote.vote/post/general/b/2");
    expect(urls).toContain("https://next.quote.vote/profile/jane");
    expect(urls).toContain("https://next.quote.vote/profile/sam");
    expect(urls.some((u) => u.includes("elsewhere.example"))).toBe(false);
    expect(urls.some((u) => u.includes("quote.vote/terms"))).toBe(false);
  });

  it("still returns static pages when the API is unavailable", async () => {
    mockedGetSitemapPosts.mockResolvedValueOnce([]);

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.url.startsWith("https://next.quote.vote/"))).toBe(true);
  });
});

import {
  buildPageMetadata,
  decodeParam,
  getSiteUrl,
  pageTitle,
  toDescription,
  toIsoDate,
} from "@/lib/seo/metadata";

describe("seo metadata helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getSiteUrl", () => {
    it("prefers NEXT_PUBLIC_SITE_URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://next.quote.vote";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "quotevote.vercel.app";
      expect(getSiteUrl().origin).toBe("https://next.quote.vote");
    });

    it("falls back to the Vercel production domain", () => {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "quotevote.vercel.app";
      expect(getSiteUrl().origin).toBe("https://quotevote.vercel.app");
    });

    it("falls back to localhost", () => {
      expect(getSiteUrl().origin).toBe("http://localhost:3000");
    });
  });

  it("pageTitle appends the site name", () => {
    expect(pageTitle("About")).toBe("About — Quote.Vote");
  });

  describe("toDescription", () => {
    it("collapses whitespace", () => {
      expect(toDescription("  Hello \n\n  world  ")).toBe("Hello world");
    });

    it("truncates long text on a word boundary with an ellipsis", () => {
      const result = toDescription("word ".repeat(100));
      expect(result.length).toBeLessThanOrEqual(160);
      expect(result.endsWith("word…")).toBe(true);
    });
  });

  describe("toIsoDate", () => {
    it("converts epoch milliseconds", () => {
      expect(toIsoDate("0")).toBe("1970-01-01T00:00:00.000Z");
    });

    it("converts date strings", () => {
      expect(toIsoDate("2026-01-02T03:04:05Z")).toBe("2026-01-02T03:04:05.000Z");
    });

    it("returns undefined for missing or invalid values", () => {
      expect(toIsoDate(null)).toBeUndefined();
      expect(toIsoDate("not a date")).toBeUndefined();
    });
  });

  it("decodeParam decodes and tolerates malformed input", () => {
    expect(decodeParam("jane%20doe")).toBe("jane doe");
    expect(decodeParam("%E0%A4%A")).toBe("%E0%A4%A");
  });

  describe("buildPageMetadata", () => {
    it("sets title, description, canonical, Open Graph and Twitter fields", () => {
      const metadata = buildPageMetadata({
        title: "About — Quote.Vote",
        description: "About page",
        path: "/about",
      });

      expect(metadata.title).toBe("About — Quote.Vote");
      expect(metadata.description).toBe("About page");
      expect(metadata.alternates?.canonical).toBe("/about");
      expect(metadata.openGraph).toMatchObject({
        title: "About — Quote.Vote",
        description: "About page",
        url: "/about",
        siteName: "Quote.Vote",
        type: "website",
        images: [expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })],
      });
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        title: "About — Quote.Vote",
        description: "About page",
        images: ["/opengraph-image"],
      });
      expect(metadata.robots).toBeUndefined();
    });

    it("adds published time only for articles", () => {
      const article = buildPageMetadata({
        title: "t",
        description: "d",
        path: "/post/a/b/c",
        type: "article",
        publishedTime: "2026-01-01T00:00:00.000Z",
      });
      expect(article.openGraph).toMatchObject({
        type: "article",
        publishedTime: "2026-01-01T00:00:00.000Z",
      });

      const page = buildPageMetadata({
        title: "t",
        description: "d",
        path: "/",
        publishedTime: "2026-01-01T00:00:00.000Z",
      });
      expect(page.openGraph).not.toHaveProperty("publishedTime");
    });

    it("marks pages noindex when requested", () => {
      const metadata = buildPageMetadata({
        title: "t",
        description: "d",
        path: "/settings",
        noIndex: true,
      });
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });
});

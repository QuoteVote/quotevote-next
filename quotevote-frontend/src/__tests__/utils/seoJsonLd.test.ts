import {
  buildPostJsonLd,
  buildProfileJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/seo/jsonLd";

describe("JSON-LD builders", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://beta.quote.vote";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  describe("serializeJsonLd", () => {
    it("escapes < so user content cannot close the script tag", () => {
      const json = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });

      expect(json).not.toContain("<");
      expect(JSON.parse(json)).toEqual({ headline: "</script><script>alert(1)</script>" });
    });

    it("drops undefined fields", () => {
      expect(serializeJsonLd({ a: "x", b: undefined })).toBe('{"a":"x"}');
    });
  });

  it("builds WebSite and Organization for the landing page", () => {
    const data = buildWebSiteJsonLd();

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"]).toEqual([
      expect.objectContaining({
        "@type": "WebSite",
        name: "Quote.Vote",
        url: "https://beta.quote.vote/",
        publisher: { "@id": "https://beta.quote.vote/#organization" },
      }),
      expect.objectContaining({
        "@type": "Organization",
        "@id": "https://beta.quote.vote/#organization",
        logo: "https://beta.quote.vote/icons/android-chrome-512x512.png",
      }),
    ]);
  });

  describe("buildPostJsonLd", () => {
    const post = {
      _id: "p1",
      title: "Why local news matters",
      text: "Local reporting   keeps communities informed.",
      url: "/post/general/why-local-news-matters/p1",
      created: "1767225600000",
      creator: { name: "Jane Doe", username: "jane" },
    };

    it("builds an Article with headline, dates, author and absolute urls", () => {
      const data = buildPostJsonLd(post, post.url);

      expect(data).toMatchObject({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Why local news matters",
        description: "Local reporting keeps communities informed.",
        url: "https://beta.quote.vote/post/general/why-local-news-matters/p1",
        mainEntityOfPage: "https://beta.quote.vote/post/general/why-local-news-matters/p1",
        image: ["https://beta.quote.vote/opengraph-image"],
        datePublished: "2026-01-01T00:00:00.000Z",
        author: [
          { "@type": "Person", name: "Jane Doe", url: "https://beta.quote.vote/profile/jane" },
        ],
        publisher: expect.objectContaining({ "@type": "Organization", name: "Quote.Vote" }),
      });
    });

    it("keeps headlines within Google's 110 character limit", () => {
      const data = buildPostJsonLd({ ...post, title: "word ".repeat(40) }, post.url);
      expect(String(data.headline).length).toBeLessThanOrEqual(110);
    });

    it("falls back to the handle and to the organization when author details are missing", () => {
      const byHandle = buildPostJsonLd({ ...post, creator: { username: "sevan", name: "" } }, "/p");
      expect(byHandle.author).toEqual([
        { "@type": "Person", name: "@sevan", url: "https://beta.quote.vote/profile/sevan" },
      ]);

      const anonymous = buildPostJsonLd({ ...post, creator: null, text: " " }, "/p");
      expect(anonymous.author).toEqual([expect.objectContaining({ "@type": "Organization" })]);
      expect(anonymous.description).toBeUndefined();
    });
  });

  describe("buildProfileJsonLd", () => {
    it("builds a ProfilePage whose main entity is the Person", () => {
      const data = buildProfileJsonLd({
        _id: "u1",
        name: "Jane Doe",
        username: "jane",
        avatar: { topType: "ShortHairShortFlat", eyeType: "Happy" },
      });

      expect(data).toMatchObject({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: "https://beta.quote.vote/profile/jane",
        mainEntity: {
          "@type": "Person",
          name: "Jane Doe",
          alternateName: "@jane",
          identifier: "u1",
          url: "https://beta.quote.vote/profile/jane",
        },
      });
      expect(String((data.mainEntity as { image?: string }).image)).toMatch(
        /^https:\/\/avataaars\.io\/\?/
      );
    });

    it("uses the handle as the name and omits the image when there is none", () => {
      const data = buildProfileJsonLd({ _id: "u2", name: " ", username: "sevan", avatar: null });
      const person = data.mainEntity as Record<string, unknown>;

      expect(person.name).toBe("@sevan");
      expect(person.image).toBeUndefined();
    });
  });
});

/**
 * @jest-environment node
 */
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPostForMetadata, getUserForMetadata } from "@/lib/seo/serverData";
import PostPage from "@/app/(dashboard)/post/[group]/[title]/[postId]/page";
import ProfilePage from "@/app/(dashboard)/profile/[username]/page";

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

const mockedGetPost = getPostForMetadata as jest.MockedFunction<typeof getPostForMetadata>;
const mockedGetUser = getUserForMetadata as jest.MockedFunction<typeof getUserForMetadata>;

function jsonLdBlocks(element: ReactNode): unknown[] {
  const html = renderToStaticMarkup(<>{element}</>);
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );
}

const postParams = Promise.resolve({ group: "general", title: "hello", postId: "p1" });

describe("post page JSON-LD", () => {
  it("renders an Article for an existing post", async () => {
    mockedGetPost.mockResolvedValueOnce({
      _id: "p1",
      title: "Hello <world>",
      text: "Body",
      url: "/post/general/hello/p1",
      created: "2026-01-01T00:00:00.000Z",
      creator: { name: "Jane", username: "jane" },
    });

    const blocks = jsonLdBlocks(await PostPage({ params: postParams }));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ "@type": "Article", headline: "Hello <world>" });
  });

  it.each([
    ["missing", null],
    ["unreachable", undefined],
  ])("renders no JSON-LD when the post is %s", async (_label, value) => {
    mockedGetPost.mockResolvedValueOnce(value);
    expect(jsonLdBlocks(await PostPage({ params: postParams }))).toHaveLength(0);
  });
});

describe("profile page JSON-LD", () => {
  it("renders a ProfilePage for an existing user", async () => {
    mockedGetUser.mockResolvedValueOnce({ _id: "u1", name: "Jane", username: "jane" });

    const blocks = jsonLdBlocks(
      await ProfilePage({ params: Promise.resolve({ username: "jane" }) })
    );

    expect(blocks).toEqual([
      expect.objectContaining({
        "@type": "ProfilePage",
        mainEntity: expect.objectContaining({ "@type": "Person", name: "Jane" }),
      }),
    ]);
  });

  it.each([
    ["unknown", null],
    ["unreachable", undefined],
  ])("renders no JSON-LD when the user is %s", async (_label, value) => {
    mockedGetUser.mockResolvedValueOnce(value);
    expect(
      jsonLdBlocks(await ProfilePage({ params: Promise.resolve({ username: "nobody" }) }))
    ).toHaveLength(0);
  });
});

/**
 * @jest-environment node
 */
import { getPostForMetadata, getSitemapPosts, getUserForMetadata } from "@/lib/seo/serverData";

describe("seo server data", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const respond = (body: unknown, status = 200): void => {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });
  };

  it("posts the post metadata query with variables", async () => {
    respond({ data: { post: { _id: "p1", title: "Hello" } } });

    await expect(getPostForMetadata("p1")).resolves.toEqual({ _id: "p1", title: "Hello" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { query: string; variables: unknown };
    expect(init.method).toBe("POST");
    expect(body.query).toContain("post(postId: $postId)");
    expect(body.variables).toEqual({ postId: "p1" });
  });

  describe("not found resolves to null", () => {
    it("when the API answers data.post: null", async () => {
      respond({ data: { post: null } });
      await expect(getPostForMetadata("missing")).resolves.toBeNull();
    });

    it("when legacy answers a deleted post with a 404 JSON body", async () => {
      respond({ errors: [{ message: "Post not found" }], data: { post: null } }, 404);
      await expect(getPostForMetadata("deleted")).resolves.toBeNull();
    });

    it("when a 404 body carries no data at all", async () => {
      respond({ errors: [{ message: "Post not found" }] }, 404);
      await expect(getPostForMetadata("deleted-no-data")).resolves.toBeNull();
    });

    it("when the user is unknown", async () => {
      respond({ errors: [{ message: "Error: User not found" }], data: { user: null } });
      await expect(getUserForMetadata("nobody")).resolves.toBeNull();
    });
  });

  describe("an unreachable API resolves to undefined", () => {
    it("on server errors", async () => {
      respond({}, 500);
      await expect(getUserForMetadata("jane")).resolves.toBeUndefined();
    });

    it("when the request throws or times out", async () => {
      fetchMock.mockRejectedValueOnce(new Error("network down"));
      await expect(getUserForMetadata("john")).resolves.toBeUndefined();
    });

    it("when a 404 body is not JSON", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      });
      await expect(getPostForMetadata("proxy-404")).resolves.toBeUndefined();
    });

    it("when a 200 body has errors but no data", async () => {
      respond({ errors: [{ message: "boom" }] });
      await expect(getPostForMetadata("errors-only")).resolves.toBeUndefined();
    });
  });

  it("returns sitemap posts or an empty list", async () => {
    respond({ data: { posts: { entities: [{ url: "/post/g/t/1" }] } } });
    await expect(getSitemapPosts(10)).resolves.toEqual([{ url: "/post/g/t/1" }]);

    respond({ errors: [{ message: "boom" }] });
    await expect(getSitemapPosts(10)).resolves.toEqual([]);
  });
});

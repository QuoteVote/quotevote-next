/**
 * @jest-environment node
 *
 * First-party avatar SVGs (#722), also used for the PNG download (#656).
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/avatar/route";
import { completeDraft } from "@/lib/avatar";
import { renderAvatarSvg } from "@/lib/avatarRender";

const draft = completeDraft({ topType: "LongHairDreads" }, "maya");
const url = (params: Record<string, string>): NextRequest =>
  new NextRequest(`http://localhost/api/avatar?${new URLSearchParams(params).toString()}`);

describe("GET /api/avatar", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("renders the avatar on our own server, with no outbound request", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const res = GET(url(draft));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(res.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'"
    );
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.text()).toBe(renderAvatarSvg(draft, "Circle"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("draws the transparent style when asked", async () => {
    const res = GET(url({ ...draft, avatarStyle: "Transparent" }));
    expect(await res.text()).toBe(renderAvatarSvg(draft, "Transparent"));
  });

  it("ignores unknown keys and values, and fills missing ones, so it always answers an avatar", async () => {
    const partial = GET(url({ topType: "LongHairDreads", skinColor: "Nope", evil: "<script>" }));
    expect(partial.status).toBe(200);
    expect(await partial.text()).toBe(
      renderAvatarSvg(completeDraft({ topType: "LongHairDreads" }, ""), "Circle")
    );

    const empty = GET(url({}));
    expect(empty.status).toBe(200);
    expect(await empty.text()).toMatch(/^<svg/);
  });
});

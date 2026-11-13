/**
 * @jest-environment node
 *
 * Same-origin avatar SVG used for the PNG download (#656).
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/avatar/route";
import { completeDraft } from "@/lib/avatar";

const draft = completeDraft({ topType: "LongHairDreads" }, "maya");
const url = (params: Record<string, string>): NextRequest =>
  new NextRequest(`http://localhost/api/avatar?${new URLSearchParams(params).toString()}`);

describe("GET /api/avatar", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("rejects missing or unknown values without calling avataaars.io", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    expect((await GET(url({ ...draft, topType: "Nope" }))).status).toBe(400);
    expect((await GET(url({ topType: "LongHairDreads" }))).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the avataaars.io SVG for a valid avatar", async () => {
    const fetchSpy = jest.fn().mockResolvedValue(new Response("<svg></svg>", { status: 200 }));
    global.fetch = fetchSpy;
    const res = await GET(url(draft));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(await res.text()).toBe("<svg></svg>");
    const requested = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(requested.hostname).toBe("avataaars.io");
    expect(requested.searchParams.get("topType")).toBe("LongHairDreads");
  });

  it("answers 502 when avataaars.io fails or returns something else", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response("<html>", { status: 200 }));
    expect((await GET(url(draft))).status).toBe(502);
    global.fetch = jest.fn().mockRejectedValue(new Error("down"));
    expect((await GET(url(draft))).status).toBe(502);
  });
});

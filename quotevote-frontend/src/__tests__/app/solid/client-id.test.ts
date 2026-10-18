/**
 * @jest-environment node
 */
import { GET } from "@/app/solid/client-id.json/route";

const ORIGINAL_ENV = { ...process.env };

function request(url: string): Request {
  return new Request(url);
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_SOLID_ENABLED: "true" };
  delete process.env.NEXT_PUBLIC_APP_URL;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("Solid Client ID Document route", () => {
  it("returns 404 when the Solid flag is off", async () => {
    process.env.NEXT_PUBLIC_SOLID_ENABLED = "false";

    const res = GET(request("https://quote.vote/solid/client-id.json"));

    expect(res.status).toBe(404);
  });

  it("serves the client document as JSON-LD using the request origin", async () => {
    const res = GET(request("https://quote.vote/solid/client-id.json"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/ld+json");
    expect(await res.json()).toEqual({
      "@context": "https://www.w3.org/ns/solid/oidc-context.jsonld",
      client_id: "https://quote.vote/solid/client-id.json",
      client_name: "Quote.Vote",
      redirect_uris: ["https://quote.vote/settings/solid/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "openid offline_access webid",
      token_endpoint_auth_method: "none",
      application_type: "web",
    });
  });

  it("prefers NEXT_PUBLIC_APP_URL over the request origin", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.org/";

    const res = GET(request("http://internal:3000/solid/client-id.json"));
    const body = (await res.json()) as { client_id: string; redirect_uris: string[] };

    expect(body.client_id).toBe("https://app.example.org/solid/client-id.json");
    expect(body.redirect_uris).toEqual(["https://app.example.org/settings/solid/callback"]);
  });
});

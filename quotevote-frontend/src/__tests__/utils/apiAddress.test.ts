import { resolveApiAddress } from "@/config/apiAddress";

describe("resolveApiAddress", () => {
  it("builds every form of the address from NEXT_PUBLIC_SERVER_URL", () => {
    expect(resolveApiAddress({ serverUrl: "https://api.example.com" })).toEqual({
      graphqlEndpoint: "https://api.example.com/graphql",
      graphqlWsEndpoint: "wss://api.example.com/graphql",
      serverUrl: "https://api.example.com",
      httpOrigin: "https://api.example.com",
      wsOrigin: "wss://api.example.com",
    });
  });

  it("uses ws:// for a local http API", () => {
    const api = resolveApiAddress({ serverUrl: "http://localhost:4000" });
    expect(api.graphqlWsEndpoint).toBe("ws://localhost:4000/graphql");
    expect(api.wsOrigin).toBe("ws://localhost:4000");
  });

  it("prefers NEXT_PUBLIC_GRAPHQL_ENDPOINT, so HTTP, WebSocket and login use the same server", () => {
    const api = resolveApiAddress({
      graphqlEndpoint: "https://staging-api.example.com/graphql",
      serverUrl: "https://other.example.com",
    });
    expect(api.graphqlEndpoint).toBe("https://staging-api.example.com/graphql");
    expect(api.graphqlWsEndpoint).toBe("wss://staging-api.example.com/graphql");
    expect(api.serverUrl).toBe("https://staging-api.example.com");
  });

  it("drops trailing slashes", () => {
    expect(resolveApiAddress({ serverUrl: "https://api.example.com/" }).graphqlEndpoint).toBe(
      "https://api.example.com/graphql"
    );
    expect(
      resolveApiAddress({ graphqlEndpoint: "https://api.example.com/graphql/" }).serverUrl
    ).toBe("https://api.example.com");
  });

  it("keeps a path prefix on the API", () => {
    const api = resolveApiAddress({ serverUrl: "https://example.com/api" });
    expect(api.graphqlEndpoint).toBe("https://example.com/api/graphql");
    expect(api.serverUrl).toBe("https://example.com/api");
    expect(api.httpOrigin).toBe("https://example.com");
  });

  it.each([{}, { serverUrl: "" }, { serverUrl: "   ", graphqlEndpoint: "" }])(
    "throws instead of falling back when no address is set (%j)",
    (input) => {
      expect(() => resolveApiAddress(input)).toThrow(/API address is not set/);
    }
  );

  it.each(["javascript:alert(1)", "ftp://api.example.com", "not a url"])("rejects %s", (value) => {
    expect(() => resolveApiAddress({ serverUrl: value })).toThrow(/NEXT_PUBLIC_SERVER_URL/);
  });
});

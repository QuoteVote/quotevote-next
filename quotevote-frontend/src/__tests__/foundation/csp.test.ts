import { buildContentSecurityPolicy, buildScriptSrcDirective } from "@/lib/security/csp";

describe("Content-Security-Policy", () => {
  it("drops unsafe-eval in production script-src", () => {
    expect(buildScriptSrcDirective(true)).toBe("script-src 'self' 'unsafe-inline'");
    expect(buildScriptSrcDirective(true)).not.toContain("unsafe-eval");
  });

  it("allows unsafe-eval in non-production for tooling", () => {
    expect(buildScriptSrcDirective(false)).toContain("unsafe-eval");
  });

  it("keeps connect-src and frame-ancestors locked down", () => {
    const csp = buildContentSecurityPolicy({
      isProduction: true,
      serverUrl: "https://api.quote.vote",
      wsUrl: "wss://api.quote.vote",
    });
    expect(csp).toContain("connect-src 'self' https://api.quote.vote wss://api.quote.vote");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });
});

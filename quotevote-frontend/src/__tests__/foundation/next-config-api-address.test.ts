import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
  PHASE_TEST,
} from "next/constants";
import createNextConfig from "../../../next.config";

const ENV_KEYS = ["NEXT_PUBLIC_SERVER_URL", "NEXT_PUBLIC_GRAPHQL_ENDPOINT"] as const;

const setApiEnv = (values: Partial<Record<(typeof ENV_KEYS)[number], string>>): void => {
  for (const key of ENV_KEYS) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
};

const cspFor = async (phase: string): Promise<string> => {
  const headers = await createNextConfig(phase).headers!();
  const csp = headers
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Content-Security-Policy");
  return csp?.value ?? "";
};

describe("next.config API address", () => {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  afterEach(() => {
    setApiEnv(saved);
  });

  it.each([PHASE_PRODUCTION_BUILD, PHASE_DEVELOPMENT_SERVER])(
    "stops %s when no API address is set",
    (phase) => {
      setApiEnv({});
      expect(() => createNextConfig(phase)).toThrow(/API address is not set/);
    }
  );

  it("stops the build when the API address isn't an http(s) URL", () => {
    setApiEnv({ NEXT_PUBLIC_SERVER_URL: "javascript:alert(1)" });
    expect(() => createNextConfig(PHASE_PRODUCTION_BUILD)).toThrow(/http:\/\/ or https:\/\//);
  });

  it.each([PHASE_TEST, PHASE_PRODUCTION_SERVER])("doesn't need an API address in %s", (phase) => {
    setApiEnv({});
    expect(() => createNextConfig(phase)).not.toThrow();
  });

  it("allows the API's HTTP and WebSocket origins in connect-src", async () => {
    setApiEnv({ NEXT_PUBLIC_SERVER_URL: "https://staging-api.example.com" });
    expect(await cspFor(PHASE_PRODUCTION_BUILD)).toContain(
      "connect-src 'self' https://staging-api.example.com wss://staging-api.example.com "
    );
  });

  it("takes the CSP origins from NEXT_PUBLIC_GRAPHQL_ENDPOINT, like the app does", async () => {
    setApiEnv({
      NEXT_PUBLIC_SERVER_URL: "http://localhost:4000",
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: "https://staging-api.example.com/graphql",
    });
    const csp = await cspFor(PHASE_PRODUCTION_BUILD);
    expect(csp).toContain("https://staging-api.example.com wss://staging-api.example.com");
    expect(csp).not.toContain("localhost:4000");
  });
});

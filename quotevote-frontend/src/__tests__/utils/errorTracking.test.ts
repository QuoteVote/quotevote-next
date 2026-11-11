import type { ErrorEvent } from "@sentry/browser";
import { envelopeUrl, isSameDsn, parseSentryDsn } from "@/lib/errorTracking/dsn";
import { scrubBreadcrumb, scrubEvent } from "@/lib/errorTracking/scrub";
import {
  ERROR_TRACKING_DATA_COLLECTION,
  ERROR_TRACKING_TUNNEL,
  initErrorTracking,
  reportError,
  resetErrorTrackingForTests,
} from "@/lib/errorTracking/client";

const scope = { setTag: jest.fn() };

jest.mock("@sentry/browser", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((callback: (s: { setTag: jest.Mock }) => void) => callback(scope)),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry = require("@sentry/browser") as {
  init: jest.Mock;
  captureException: jest.Mock;
};

const DSN = "https://public123@o1.ingest.example.io/42";

describe("parseSentryDsn", () => {
  it("reads the key, host and project", () => {
    expect(parseSentryDsn(DSN)).toEqual({
      protocol: "https:",
      host: "o1.ingest.example.io",
      projectId: "42",
      publicKey: "public123",
    });
    expect(envelopeUrl(parseSentryDsn(DSN)!)).toBe("https://o1.ingest.example.io/api/42/envelope/");
  });

  it.each([
    undefined,
    "",
    "   ",
    "not a url",
    "ftp://key@host/1",
    "https://host/42",
    "https://key@host/abc",
  ])("returns null for %p", (value) => {
    expect(parseSentryDsn(value)).toBeNull();
  });

  it("compares two DSNs", () => {
    const a = parseSentryDsn(DSN)!;
    expect(isSameDsn(a, parseSentryDsn(DSN)!)).toBe(true);
    expect(isSameDsn(a, parseSentryDsn("https://public123@o1.ingest.example.io/43")!)).toBe(false);
    expect(isSameDsn(a, parseSentryDsn("https://other@o1.ingest.example.io/42")!)).toBe(false);
    expect(isSameDsn(a, parseSentryDsn("https://public123@evil.example.com/42")!)).toBe(false);
  });
});

describe("scrubEvent", () => {
  it("drops the user, extras, cookies and query string, and keeps the user agent", () => {
    const event = {
      type: undefined,
      user: { id: "u1", username: "alice" },
      extra: { note: "x" },
      request: {
        url: "https://quote.vote/search?q=private+words",
        headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.vote/x?y=1" },
        cookies: { "qv-token": "secret" },
        query_string: "q=private+words",
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.request).toEqual({
      url: "https://quote.vote/search",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
  });

  it("drops console and click breadcrumbs and strips query strings from the rest", () => {
    const event = {
      type: undefined,
      breadcrumbs: [
        { category: "console", message: "draft text" },
        { category: "ui.click", message: 'button[aria-label="Clear notification from Bob"]' },
        { category: "ui.input", message: "textarea" },
        { category: "fetch", data: { url: "https://api.example.com/graphql?x=1", method: "POST" } },
        { category: "navigation", data: { from: "/search?q=a", to: "/post/1#top" } },
      ],
    } as unknown as ErrorEvent;

    expect(scrubEvent(event).breadcrumbs).toEqual([
      { category: "fetch", data: { url: "https://api.example.com/graphql", method: "POST" } },
      { category: "navigation", data: { from: "/search", to: "/post/1" } },
    ]);
    expect(scrubBreadcrumb({ category: "console" })).toBeNull();
  });
});

describe("error tracking client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetErrorTrackingForTests();
  });

  it("stays off without a valid DSN and reports nothing", () => {
    expect(initErrorTracking(undefined)).toBe(false);
    expect(initErrorTracking("not a dsn")).toBe(false);
    reportError(new Error("boom"), { source: "error-boundary" });
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("starts once, through the tunnel, with data collection and tracing off", () => {
    expect(initErrorTracking(DSN, "staging")).toBe(true);
    initErrorTracking(DSN, "staging");

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    const options = Sentry.init.mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: DSN,
      environment: "staging",
      tunnel: ERROR_TRACKING_TUNNEL,
      tracesSampleRate: 0,
      dataCollection: ERROR_TRACKING_DATA_COLLECTION,
    });
    expect(ERROR_TRACKING_DATA_COLLECTION).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });

    const kept = options.integrations([
      { name: "GlobalHandlers" },
      { name: "BrowserSession" },
      { name: "Breadcrumbs" },
    ]);
    expect(kept.map((integration: { name: string }) => integration.name)).toEqual([
      "GlobalHandlers",
      "Breadcrumbs",
    ]);
  });

  it("tags reports with where they were caught", () => {
    initErrorTracking(DSN);
    const error = new Error("render failed");

    reportError(error, { source: "error-page", digest: "123" });

    expect(scope.setTag).toHaveBeenCalledWith("source", "error-page");
    expect(scope.setTag).toHaveBeenCalledWith("digest", "123");
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});

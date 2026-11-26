/**
 * Staying signed in (#804): a request refused for an ended session is renewed once and
 * sent again, and the session ends with a message when it can't be renewed.
 */

jest.mock("sonner", () => ({ toast: { info: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/auth-gate", () => ({ triggerAuthGate: jest.fn() }));

import { gql } from "@apollo/client";
import { toast } from "sonner";
import { triggerAuthGate } from "@/lib/auth-gate";
import { createApolloClient } from "@/lib/apollo/apollo-client";
import { getToken, setRefreshToken, setToken } from "@/lib/auth";
import { resetRenewalForTests } from "@/lib/auth/session";
import { SESSION_ENDED_MESSAGE } from "@/lib/auth/endSession";
import { installMemoryStorage, restoreStorage } from "../utils/memoryStorage";

const b64url = (value: Record<string, unknown>): string =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const tokenExpiringIn = (inMs: number, tag: string): string =>
  `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
    exp: Math.floor((Date.now() + inMs) / 1000),
    tag,
  })}.sig`;

const ME = gql`
  query Me {
    me {
      _id
    }
  }
`;

const json = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  text: async () => JSON.stringify(body),
  json: async () => body,
});

const unauthenticated = json({
  errors: [{ message: "Auth token not found in request", extensions: { code: "UNAUTHENTICATED" } }],
  data: null,
});

const originalFetch = global.fetch;

beforeAll(() => installMemoryStorage());
afterAll(() => restoreStorage());

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  resetRenewalForTests();
});

afterEach(() => {
  global.fetch = originalFetch;
});

/** The `authorization` header each GraphQL request was sent with. */
const graphqlAuthHeaders = (fetchMock: jest.Mock): (string | undefined)[] =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith("/graphql"))
    .map(([, init]) => (init?.headers as Record<string, string> | undefined)?.authorization);

describe("Apollo session renewal (#804)", () => {
  it("renews a refused session once and sends the request again with the new token", async () => {
    // The server refuses a token the client still thinks is valid (e.g. a clock skew).
    const stale = tokenExpiringIn(10 * 60_000, "stale");
    const renewed = tokenExpiringIn(15 * 60_000, "renewed");
    setToken(stale);
    setRefreshToken("refresh-1");
    // The client renews only a token that is about to expire, so make it look that way
    // once the server has refused it.
    let graphqlCalls = 0;
    const fetchMock = jest.fn(async (url: string) => {
      if (url.endsWith("/auth/refresh")) return json({ accessToken: renewed });
      graphqlCalls += 1;
      if (graphqlCalls === 1) {
        setToken(tokenExpiringIn(-1_000, "expired"));
        return unauthenticated;
      }
      return json({ data: { me: { __typename: "User", _id: "u1" } } });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = createApolloClient();
    const result = await client.query({ query: ME, fetchPolicy: "network-only" });

    expect(result.data).toEqual({ me: { __typename: "User", _id: "u1" } });
    expect(getToken()).toBe(renewed);
    expect(graphqlAuthHeaders(fetchMock)).toEqual([`Bearer ${stale}`, `Bearer ${renewed}`]);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("renews an expired token before sending, so the request is not refused", async () => {
    const renewed = tokenExpiringIn(15 * 60_000, "renewed");
    setToken(tokenExpiringIn(-1_000, "expired"));
    setRefreshToken("refresh-1");
    const fetchMock = jest.fn(async (url: string) =>
      url.endsWith("/auth/refresh")
        ? json({ accessToken: renewed })
        : json({ data: { me: { __typename: "User", _id: "u1" } } })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await createApolloClient().query({ query: ME, fetchPolicy: "network-only" });

    expect(graphqlAuthHeaders(fetchMock)).toEqual([`Bearer ${renewed}`]);
  });

  it("ends the session with a message when renewal is refused", async () => {
    setToken(tokenExpiringIn(-1_000, "expired"));
    setRefreshToken("refresh-expired");
    const fetchMock = jest.fn(async (url: string) =>
      url.endsWith("/auth/refresh")
        ? { ...json({ message: "Invalid or expired refresh token." }), ok: false, status: 401 }
        : unauthenticated
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await createApolloClient()
      .query({ query: ME, fetchPolicy: "network-only" })
      .catch(() => undefined);

    expect(getToken()).toBeNull();
    expect(toast.info).toHaveBeenCalledWith(SESSION_ENDED_MESSAGE, { id: "session-ended" });
    expect(triggerAuthGate).toHaveBeenCalledWith({ view: "login" });
  });

  it("retries only once when the renewed token is refused too", async () => {
    setToken(tokenExpiringIn(10 * 60_000, "a"));
    setRefreshToken("refresh-1");
    const fetchMock = jest.fn(async (url: string) =>
      url.endsWith("/auth/refresh")
        ? json({ accessToken: tokenExpiringIn(15 * 60_000, "b") })
        : unauthenticated
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await createApolloClient()
      .query({ query: ME, fetchPolicy: "network-only" })
      .catch(() => undefined);

    expect(graphqlAuthHeaders(fetchMock).length).toBe(2);
    expect(toast.info).toHaveBeenCalledWith(SESSION_ENDED_MESSAGE, { id: "session-ended" });
  });
});

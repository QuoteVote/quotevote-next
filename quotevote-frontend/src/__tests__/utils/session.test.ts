/**
 * Staying signed in (#804): renewing the 15-minute sign-in with the refresh token,
 * in the background and on demand, and ending the session when renewal fails.
 */

jest.mock("sonner", () => ({ toast: { info: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/auth-gate", () => ({ triggerAuthGate: jest.fn() }));

import { toast } from "sonner";
import { triggerAuthGate } from "@/lib/auth-gate";
import {
  getRefreshToken,
  getToken,
  loginUser,
  removeToken,
  setRefreshToken,
  setToken,
} from "@/lib/auth";
import { SESSION_ENDED_MESSAGE, endSession } from "@/lib/auth/endSession";
import {
  RENEW_BEFORE_EXPIRY_MS,
  needsRenewal,
  renewSession,
  resetRenewalForTests,
  startSessionRenewal,
} from "@/lib/auth/session";
import { useAppStore } from "@/store/useAppStore";
import { installMemoryStorage, restoreStorage } from "./memoryStorage";

const b64url = (value: Record<string, unknown>): string =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

/** A JWT-shaped token expiring `inMs` from now (the client only reads `exp`). */
const tokenExpiringIn = (inMs: number, tag = "a"): string =>
  `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
    exp: Math.floor((Date.now() + inMs) / 1000),
    tag,
  })}.sig`;

const originalFetch = global.fetch;

const mockFetchOnce = (ok: boolean, body: Record<string, unknown>) =>
  jest.fn().mockResolvedValue({
    ok,
    headers: { get: () => "application/json" },
    json: async () => body,
  });

beforeAll(() => {
  installMemoryStorage();
});

afterAll(() => {
  restoreStorage();
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  document.cookie = "qv-token=; path=/; max-age=0";
  document.cookie = "qv-refresh=; path=/; max-age=0";
  resetRenewalForTests();
  useAppStore.getState().logout();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe("needsRenewal", () => {
  it("is false for a token with more than a minute left", () => {
    expect(needsRenewal(tokenExpiringIn(10 * 60_000))).toBe(false);
  });

  it("is true within a minute of expiry, after expiry, or without a readable token", () => {
    expect(needsRenewal(tokenExpiringIn(RENEW_BEFORE_EXPIRY_MS - 1_000))).toBe(true);
    expect(needsRenewal(tokenExpiringIn(-1_000))).toBe(true);
    expect(needsRenewal("not-a-token")).toBe(true);
    expect(needsRenewal(null)).toBe(true);
  });
});

describe("renewSession", () => {
  it("keeps a token that is not about to expire, without asking the backend", async () => {
    const current = tokenExpiringIn(10 * 60_000);
    setToken(current);
    setRefreshToken("refresh-1");
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(renewSession()).resolves.toBe(current);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renews an expiring token with the refresh token and stores the new one", async () => {
    setToken(tokenExpiringIn(30_000));
    setRefreshToken("refresh-1");
    const renewed = tokenExpiringIn(15 * 60_000, "renewed");
    global.fetch = mockFetchOnce(true, {
      accessToken: renewed,
      refreshToken: "refresh-1",
    }) as unknown as typeof fetch;

    await expect(renewSession()).resolves.toBe(renewed);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-1" }),
      })
    );
    expect(getToken()).toBe(renewed);
    expect(document.cookie).toContain(`qv-token=${renewed}`);
  });

  it("returns null and keeps the old token when the backend refuses", async () => {
    const old = tokenExpiringIn(-1_000);
    setToken(old);
    setRefreshToken("refresh-expired");
    global.fetch = mockFetchOnce(false, {
      message: "Invalid or expired refresh token.",
    }) as unknown as typeof fetch;

    await expect(renewSession()).resolves.toBeNull();
    expect(getToken()).toBe(old);
  });

  it("returns null without a refresh token", async () => {
    setToken(tokenExpiringIn(-1_000));
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(renewSession()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends one request when several callers renew at once", async () => {
    setToken(tokenExpiringIn(-1_000));
    setRefreshToken("refresh-1");
    const renewed = tokenExpiringIn(15 * 60_000, "renewed");
    global.fetch = mockFetchOnce(true, { accessToken: renewed }) as unknown as typeof fetch;

    const results = await Promise.all([renewSession(), renewSession(), renewSession()]);

    expect(results).toEqual([renewed, renewed, renewed]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("startSessionRenewal", () => {
  it("renews shortly before the token expires and keeps going", async () => {
    jest.useFakeTimers();
    setToken(tokenExpiringIn(3 * 60_000));
    setRefreshToken("refresh-1");
    const renewed = tokenExpiringIn(15 * 60_000, "renewed");
    global.fetch = mockFetchOnce(true, { accessToken: renewed }) as unknown as typeof fetch;
    const onEnded = jest.fn();

    const stop = startSessionRenewal(onEnded);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(global.fetch).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(2 * 60_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getToken()).toBe(renewed);
    expect(onEnded).not.toHaveBeenCalled();
    stop();
  });

  it("ends the session when renewal is refused", async () => {
    jest.useFakeTimers();
    setToken(tokenExpiringIn(-1_000));
    setRefreshToken("refresh-1");
    global.fetch = mockFetchOnce(false, {}) as unknown as typeof fetch;
    const onEnded = jest.fn();

    const stop = startSessionRenewal(onEnded);
    await jest.advanceTimersByTimeAsync(0);

    expect(onEnded).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does nothing for a guest", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn() as unknown as typeof fetch;
    const onEnded = jest.fn();

    const stop = startSessionRenewal(onEnded);
    await jest.advanceTimersByTimeAsync(60 * 60_000);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(onEnded).not.toHaveBeenCalled();
    stop();
  });

  it("stops renewing once stopped", async () => {
    jest.useFakeTimers();
    setToken(tokenExpiringIn(3 * 60_000));
    setRefreshToken("refresh-1");
    global.fetch = jest.fn() as unknown as typeof fetch;

    const stop = startSessionRenewal(jest.fn());
    stop();
    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("signing in and out", () => {
  it("keeps the refresh token from sign-in", async () => {
    global.fetch = mockFetchOnce(true, {
      accessToken: tokenExpiringIn(15 * 60_000),
      refreshToken: "refresh-from-login",
      user: { _id: "u1", username: "member" },
    }) as unknown as typeof fetch;

    await loginUser("member", "secret-value");

    expect(getRefreshToken()).toBe("refresh-from-login");
    expect(document.cookie).toContain("qv-refresh=refresh-from-login");
  });

  it("signing out clears both tokens and both cookies", () => {
    setToken(tokenExpiringIn(15 * 60_000));
    setRefreshToken("refresh-1");

    removeToken();

    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(document.cookie).not.toContain("qv-token=ey");
    expect(document.cookie).not.toContain("qv-refresh=refresh-1");
  });
});

describe("endSession", () => {
  it("signs out, explains why and opens sign-in over the same page", () => {
    setToken(tokenExpiringIn(-1_000));
    setRefreshToken("refresh-1");

    endSession();

    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(toast.info).toHaveBeenCalledWith(SESSION_ENDED_MESSAGE, { id: "session-ended" });
    expect(triggerAuthGate).toHaveBeenCalledWith({ view: "login" });
  });

  it("says nothing when there was no session", () => {
    endSession();

    expect(toast.info).not.toHaveBeenCalled();
    expect(triggerAuthGate).not.toHaveBeenCalled();
  });
});

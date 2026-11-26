/**
 * Keeps a signed-in member signed in (#804).
 *
 * Sign-in returns an access token that lasts 15 minutes and a refresh token that lasts
 * 7 days. The access token is renewed in the background shortly before it expires, and
 * again when a request is refused for an ended session, so a member stays signed in while
 * they keep using the site. Only when renewal fails does the session end.
 */

import { jwtDecode } from "jwt-decode";
import { env } from "@/config/env";
import {
  SESSION_CHANGE_EVENT,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "@/lib/auth";
import type { RefreshApiResponse } from "@/types/login";
import type { DecodedToken } from "@/types/store";

/** Renew this long before the access token expires. */
export const RENEW_BEFORE_EXPIRY_MS = 60_000;

/** Never schedule a renewal sooner than this, so an odd clock can't cause a tight loop. */
const MIN_RENEWAL_DELAY_MS = 5_000;

/** When the access token expires, in ms since the epoch, or null if it can't be read. */
export function tokenExpiresAt(token: string | null): number | null {
  if (!token) return null;
  try {
    const { exp } = jwtDecode<DecodedToken>(token);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, unreadable or within `RENEW_BEFORE_EXPIRY_MS` of expiring. */
export function needsRenewal(token: string | null, now = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt === null || expiresAt - now <= RENEW_BEFORE_EXPIRY_MS;
}

/** Asks the backend for a new access token. Resolves to null when it refuses. */
export async function postRefresh(
  serverUrl: string,
  refreshToken: string
): Promise<RefreshApiResponse | null> {
  try {
    const response = await fetch(`${serverUrl.replace(/\/$/, "")}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as RefreshApiResponse;
    return data.accessToken ? data : null;
  } catch {
    return null;
  }
}

let inFlight: Promise<string | null> | null = null;

/**
 * Renews the access token and returns it, or null when the session can't be renewed
 * (no refresh token, or the backend refused it). Concurrent callers share one request,
 * and a token another tab already renewed is used as is.
 */
export function renewSession(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const current = getToken();
    if (current && !needsRenewal(current)) return current;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const data = await postRefresh(env.serverUrl, refreshToken);
    if (!data?.accessToken) return null;

    setToken(data.accessToken);
    if (data.refreshToken && data.refreshToken !== refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data.accessToken;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Test helper: forget a renewal in progress. */
export function resetRenewalForTests(): void {
  inFlight = null;
}

/**
 * Renews the session shortly before each access token expires, and when the tab becomes
 * visible again after being hidden. Returns a function that stops it.
 */
export function startSessionRenewal(onEnded: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const schedule = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (stopped) return;
    const expiresAt = tokenExpiresAt(getToken());
    if (expiresAt === null || !getRefreshToken()) return;
    const delay = Math.max(expiresAt - Date.now() - RENEW_BEFORE_EXPIRY_MS, MIN_RENEWAL_DELAY_MS);
    timer = setTimeout(() => {
      void check();
    }, delay);
  };

  const check = async (): Promise<void> => {
    if (stopped) return;
    const token = getToken();
    if (!token || !getRefreshToken()) return;
    if (needsRenewal(token)) {
      const renewed = await renewSession();
      if (!renewed) {
        onEnded();
        return;
      }
    }
    schedule();
  };

  const onVisible = (): void => {
    if (document.visibilityState === "visible") void check();
  };
  // Another tab signing in, renewing or signing out changes the token here too.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === "token" || event.key === "refreshToken" || event.key === null) schedule();
  };

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("storage", onStorage);
  window.addEventListener(SESSION_CHANGE_EVENT, schedule);
  void check();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SESSION_CHANGE_EVENT, schedule);
  };
}

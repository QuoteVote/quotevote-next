/**
 * Authentication utilities
 *
 * Token helpers write to both localStorage and a `qv-token` cookie so that
 * the Next.js proxy can read the token without accessing localStorage.
 */

import type { LoginResponse } from '@/types/login';
import { env } from '@/config/env';
import { getLoginToken, postLogin } from '@/lib/auth/restLogin';

const TOKEN_KEY = 'token';
const COOKIE_NAME = 'qv-token';
/** The refresh token from sign-in, kept so the session can be renewed (#804). */
const REFRESH_KEY = 'refreshToken';
/** Read by the proxy to renew an expired `qv-token` before it redirects to sign-in. */
export const REFRESH_COOKIE_NAME = 'qv-refresh';
/** How long the refresh cookie lives; the backend's refresh token lasts 7 days. */
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
/** Sent on `window` whenever the tokens change in this tab, so session renewal can reschedule. */
export const SESSION_CHANGE_EVENT = 'qv-session-change';

function notifySessionChange(): void {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/** Read the auth token (client-side only). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persist the auth token to localStorage and to a `qv-token` cookie.
 * The cookie is readable by the Next.js proxy (src/proxy.ts).
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // SameSite=Lax lets the cookie be sent on normal navigations; Secure is omitted
  // in dev so HTTP localhost works fine.
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax`;
  notifySessionChange();
}

/** Read the refresh token (client-side only). */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

/** Persist the refresh token to localStorage and to the `qv-refresh` cookie for the proxy. */
export function setRefreshToken(refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_KEY, refreshToken);
  document.cookie = `${REFRESH_COOKIE_NAME}=${refreshToken}; path=/; max-age=${REFRESH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Remove both tokens from localStorage and clear both cookies, so signing out ends the session. */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  notifySessionChange();
}

/**
 * Login user via REST POST /login
 *
 * @param username - User's username or email
 * @param password - User's password
 * @returns Promise with login response including decoded user data
 */
export async function loginUser(
    username: string,
    password: string
): Promise<LoginResponse> {
    try {
        const { response, data } = await postLogin(env.serverUrl, username, password);

        if (!response.ok) {
            return {
                success: false,
                error: data?.message || 'Invalid username or password.',
            };
        }

        const token = getLoginToken(data);
        const { user } = data;

        if (!token) {
            return { success: false, error: 'No token received from server.' };
        }

        // Persist token to localStorage + qv-token cookie for the proxy
        setToken(token);
        // Without a refresh token (the legacy API sends none), the session ends with the token.
        if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
        } else {
            localStorage.removeItem(REFRESH_KEY);
        }

        return { success: true, data: { user: user as Record<string, unknown>, token } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed. Please try again.',
        };
    }
}

/**
 * Sign up user
 * 
 * @param userData - User signup data
 * @returns Promise with signup response
 * 
 * @todo Replace with actual GraphQL mutation when auth is migrated
 */
export async function signupUser(userData: {
    username: string;
    email: string;
    password: string;
}): Promise<LoginResponse> {
    try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!userData.username || !userData.email || !userData.password) {
            return {
                success: false,
                error: 'All fields are required',
            };
        }

        return {
            success: true,
            data: {
                user: {
                    username: userData.username,
                    email: userData.email,
                } as Record<string, unknown>,
                token: 'placeholder-token',
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Signup failed',
        };
    }
}

/**
 * Reset password
 * 
 * @param email - User's email
 * @returns Promise with reset response
 * 
 * @todo Replace with actual GraphQL mutation when auth is migrated
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!email) {
            return {
                success: false,
                error: 'Email is required',
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Password reset failed',
        };
    }
}

/**
 * Logout user — clears token from localStorage and cookie.
 */
export function logoutUser(): void {
    removeToken();
}

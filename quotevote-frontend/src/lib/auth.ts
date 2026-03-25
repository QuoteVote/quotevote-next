/**
 * Authentication utilities
 *
 * Token helpers write to both localStorage and a `qv-token` cookie so that
 * the Next.js edge middleware can read the token without accessing localStorage.
 */

import { jwtDecode } from 'jwt-decode';
import type { LoginResponse } from '@/types/login';
import { env } from '@/config/env';

const TOKEN_KEY = 'token';
const COOKIE_NAME = 'qv-token';

/** Read the auth token (client-side only). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persist the auth token to localStorage and to a `qv-token` cookie.
 * The cookie is readable by Next.js middleware (edge runtime).
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // SameSite=Lax lets the cookie be sent on normal navigations; Secure is omitted
  // in dev so HTTP localhost works fine.
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax`;
}

/** Remove the auth token from localStorage and clear the cookie. */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
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
        const serverUrl = env.serverUrl;
        const response = await fetch(`${serverUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data?.message || 'Invalid username or password.',
            };
        }

        const { token } = data;

        if (!token) {
            return { success: false, error: 'No token received from server.' };
        }

        // Persist token to localStorage + qv-token cookie for middleware
        setToken(token);

        // Decode JWT to extract user data (same approach as original app)
        const user = jwtDecode<Record<string, unknown>>(token);

        return { success: true, data: { user, token } };
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

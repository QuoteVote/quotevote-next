import crypto from 'crypto';
import { discoverIssuer } from './discovery';

/**
 * Solid OIDC Authorization Flow
 * Handles OAuth 2.0 / OpenID Connect authorization code flow
 */

export interface AuthorizationParams {
    issuer: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
}

export interface AuthorizationResult {
    authorizationUrl: string;
    state: string;
    codeVerifier?: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type: string;
    expires_in?: number;
    scope?: string;
}

/**
 * Generate authorization URL for Solid OIDC flow
 * @param params - Authorization parameters
 * @returns Authorization URL and state
 */
export async function generateAuthorizationUrl(
    params: AuthorizationParams
): Promise<AuthorizationResult> {
    const metadata = await discoverIssuer(params.issuer);

    // Generate state for CSRF protection
    const state = params.state || generateRandomString(32);

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Build authorization URL
    const authUrl = new URL(metadata.authorization_endpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', params.clientId);
    authUrl.searchParams.set('redirect_uri', params.redirectUri);
    authUrl.searchParams.set('scope', params.scope || 'openid profile offline_access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return {
        authorizationUrl: authUrl.toString(),
        state,
        codeVerifier,
    };
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - Redirect URI used in authorization
 * @param issuer - Issuer URL
 * @param clientId - Client ID
 * @returns Token response
 */
export async function exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    issuer: string,
    clientId: string
): Promise<TokenResponse> {
    const metadata = await discoverIssuer(issuer);

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
    });

    try {
        const response = await fetch(metadata.token_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: body.toString(),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        const tokens = await response.json() as TokenResponse;

        // Validate token response
        if (!tokens.access_token) {
            throw new Error('Invalid token response: missing access_token');
        }

        return tokens;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to exchange code for tokens: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 * @param issuer - Issuer URL
 * @param clientId - Client ID
 * @returns New token response
 */
export async function refreshAccessToken(
    refreshToken: string,
    issuer: string,
    clientId: string
): Promise<TokenResponse> {
    const metadata = await discoverIssuer(issuer);

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
    });

    try {
        const response = await fetch(metadata.token_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: body.toString(),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        const tokens = await response.json() as TokenResponse;

        if (!tokens.access_token) {
            throw new Error('Invalid token response: missing access_token');
        }

        return tokens;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to refresh access token: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Parse ID token claims (basic JWT parsing without verification)
 * Note: In production, you should verify the JWT signature
 * @param idToken - ID token JWT
 * @returns Decoded claims
 */
export function parseIdToken(idToken: string): Record<string, unknown> {
    try {
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64url').toString('utf8');
        return JSON.parse(decoded);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to parse ID token: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Generate cryptographically secure random string
 * @param length - Length of string
 * @returns Random string
 */
function generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Generate PKCE code challenge from verifier
 * @param verifier - Code verifier
 * @returns Code challenge (SHA-256 hash)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
}

import crypto from 'crypto';
import { discoverIssuer } from './discovery';
import { SolidOidcError } from '../errors';

/**
 * Solid OIDC Authorization Flow
 * Handles OAuth 2.0 / OpenID Connect authorization code flow (with PKCE).
 *
 * Security notes:
 * - Errors thrown here never include provider response bodies, tokens,
 *   authorization codes or verifiers. Only the error code and HTTP status are kept.
 * - `parseIdToken` does NOT verify the JWT signature. Verification needs the
 *   issuer's JWKS (`jwks_uri` from discovery) and a JWT library; neither is
 *   available as a direct dependency, so the ID token is only read from the
 *   back-channel token response. See app/solid/README.md ("Limitations").
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
 * @returns Authorization URL, state and PKCE code verifier (the caller must persist the verifier server-side)
 */
export async function generateAuthorizationUrl(
    params: AuthorizationParams
): Promise<AuthorizationResult> {
    const metadata = await discoverIssuer(params.issuer);

    // Generate state for CSRF protection
    const state = params.state || generateRandomString(32);

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateRandomString(64);
    const codeChallenge = generateCodeChallenge(codeVerifier);

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
 * @throws {SolidOidcError} with a sanitized message
 */
export async function exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    issuer: string,
    clientId: string
): Promise<TokenResponse> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
    });

    return requestTokens(issuer, body);
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 * @param issuer - Issuer URL
 * @param clientId - Client ID
 * @returns New token response
 * @throws {SolidOidcError} code `invalid_grant` when the provider rejects the refresh token
 */
export async function refreshAccessToken(
    refreshToken: string,
    issuer: string,
    clientId: string
): Promise<TokenResponse> {
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
    });

    return requestTokens(issuer, body);
}

/**
 * POST a form to the issuer's token endpoint and validate the response.
 */
async function requestTokens(issuer: string, body: URLSearchParams): Promise<TokenResponse> {
    const metadata = await discoverIssuer(issuer).catch(() => {
        throw new SolidOidcError('provider_error', 'Issuer discovery failed');
    });

    let response: Response;
    try {
        response = await fetch(metadata.token_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: body.toString(),
            signal: AbortSignal.timeout(10000),
        });
    } catch {
        throw new SolidOidcError('provider_error', 'Token endpoint request failed');
    }

    if (!response.ok) {
        // Only the standard OAuth error code is inspected; the body is never echoed.
        const providerError = await readOAuthErrorCode(response);
        if (providerError === 'invalid_grant') {
            throw new SolidOidcError('invalid_grant', 'Authorization grant was rejected', response.status);
        }
        throw new SolidOidcError(
            'provider_error',
            `Token endpoint returned HTTP ${response.status}`,
            response.status
        );
    }

    let tokens: TokenResponse;
    try {
        tokens = (await response.json()) as TokenResponse;
    } catch {
        throw new SolidOidcError('invalid_response', 'Token response was not valid JSON');
    }

    if (!tokens || typeof tokens.access_token !== 'string' || tokens.access_token === '') {
        throw new SolidOidcError('invalid_response', 'Invalid token response: missing access_token');
    }

    return tokens;
}

async function readOAuthErrorCode(response: Response): Promise<string | undefined> {
    try {
        const data = (await response.json()) as { error?: unknown } | null;
        return typeof data?.error === 'string' ? data.error : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Parse ID token claims (basic JWT parsing WITHOUT signature verification).
 * See the module header for why verification is not performed here.
 * @param idToken - ID token JWT
 * @returns Decoded claims
 * @throws {Error} with a generic message (the payload is never echoed)
 */
export function parseIdToken(idToken: string): Record<string, unknown> {
    const parts = typeof idToken === 'string' ? idToken.split('.') : [];
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }

    let claims: unknown;
    try {
        claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
        // Do not forward JSON.parse messages: they can contain payload fragments.
        throw new Error('Invalid ID token payload');
    }

    if (!claims || typeof claims !== 'object' || Array.isArray(claims)) {
        throw new Error('Invalid ID token payload');
    }
    return claims as Record<string, unknown>;
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
 * Generate PKCE code challenge from verifier (S256)
 * @param verifier - Code verifier
 * @returns Code challenge (base64url SHA-256 digest)
 */
function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

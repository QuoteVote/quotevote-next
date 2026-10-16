import { assertPublicUrl } from '../oidc/security';
import type { PrismaClient, SolidConnection as SolidConnectionRecord } from '@prisma/client';
import { refreshAccessToken, type TokenResponse } from '../oidc/authorization';
import { encryptTokens, decryptTokens } from '../storage/encryption';
import { SolidNotConnectedError, SolidOidcError, SolidPodError } from '../errors';

/**
 * Solid Client for authenticated fetch operations
 * Handles token refresh and authenticated requests to Solid Pods.
 *
 * Tokens are stored encrypted on the SolidConnection row (Prisma). Access
 * tokens are refreshed when they expire within 5 minutes, and once after a 401.
 */

export interface SolidFetchOptions extends RequestInit {
    timeout?: number;
}

export interface SolidClientConfig {
    userId: string;
    clientId: string;
    prisma: PrismaClient;
}

/** Decrypted token payload stored in SolidConnection.encryptedTokens */
interface StoredTokens {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    [key: string]: unknown;
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const DEFAULT_EXPIRES_IN_SECONDS = 3600;

/**
 * Solid Client class for making authenticated requests
 */
export class SolidClient {
    private readonly userId: string;
    private readonly clientId: string;
    private readonly prisma: PrismaClient;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor(config: SolidClientConfig) {
        this.userId = config.userId;
        this.clientId = config.clientId;
        this.prisma = config.prisma;
    }

    /**
     * Make authenticated fetch request to Solid Pod
     * @param url - Resource URL
     * @param options - Fetch options
     * @returns Response
     * @throws {SolidPodError} on timeout / network failure
     * @throws {SolidOidcError} when the token cannot be refreshed
     * @throws {SolidNotConnectedError} when the user has no connection
     */
    async fetch(url: string, options: SolidFetchOptions = {}): Promise<Response> {
        const { timeout = 10000, ...fetchOptions } = options;

        await assertPublicUrl(url);
        await this.ensureValidToken();
        const response = await this.send(url, fetchOptions, timeout);

        if (response.status !== 401) {
            return response;
        }

        // Access token rejected: refresh once and retry.
        await this.refreshToken();
        return this.send(url, fetchOptions, timeout);
    }

    /**
     * Perform one HTTP request with the current access token.
     */
    private async send(url: string, init: RequestInit, timeout: number): Promise<Response> {
        if (!this.accessToken) {
            throw new SolidOidcError('invalid_grant', 'No valid access token available');
        }

        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${this.accessToken}`);

        try {
            return await fetch(url, {
                ...init,
                headers,
                signal: AbortSignal.timeout(timeout),
            });
        } catch (error) {
            const isTimeout = error instanceof Error && error.name === 'TimeoutError';
            // Do not include the URL or the underlying message: keep errors generic.
            throw isTimeout
                ? new SolidPodError('timeout', 'Pod request timed out')
                : new SolidPodError('network', 'Pod request failed');
        }
    }

    /**
     * Ensure we have a valid access token
     */
    private async ensureValidToken(): Promise<void> {
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return;
        }

        await this.loadTokenFromDatabase();

        // Refresh when expired or about to expire
        if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < REFRESH_MARGIN_MS) {
            await this.refreshToken();
        }
    }

    /**
     * Load the connection row for this user
     * @throws {SolidNotConnectedError} when no connection exists
     */
    private async loadConnection(): Promise<SolidConnectionRecord> {
        const connection = await this.prisma.solidConnection.findUnique({
            where: { userId: this.userId },
        });

        if (!connection) {
            throw new SolidNotConnectedError();
        }
        return connection;
    }

    /**
     * Load access token from database
     */
    private async loadTokenFromDatabase(): Promise<void> {
        const connection = await this.loadConnection();
        const tokens = readStoredTokens(connection.encryptedTokens);

        if (typeof tokens.access_token !== 'string' || tokens.access_token === '') {
            throw new SolidOidcError('invalid_grant', 'Stored credentials are incomplete');
        }

        this.accessToken = tokens.access_token;
        this.tokenExpiry = connection.tokenExpiry ?? null;
    }

    /**
     * Refresh access token and persist the merged token set
     */
    private async refreshToken(): Promise<void> {
        const connection = await this.loadConnection();
        const stored = readStoredTokens(connection.encryptedTokens);

        if (!stored.refresh_token) {
            // Without a refresh token the user has to reconnect.
            throw new SolidOidcError('invalid_grant', 'No refresh token available');
        }

        const newTokens = await refreshAccessToken(
            stored.refresh_token,
            connection.issuer,
            this.clientId
        );

        this.accessToken = newTokens.access_token;
        const expiresIn = newTokens.expires_in || DEFAULT_EXPIRES_IN_SECONDS;
        this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

        await this.saveTokensToDatabase(stored, newTokens, this.tokenExpiry);
    }

    /**
     * Save tokens to database, preserving existing values not returned by the provider
     * (e.g. refresh_token is kept when the refresh response omits it).
     */
    private async saveTokensToDatabase(
        existing: StoredTokens,
        tokens: TokenResponse,
        tokenExpiry: Date
    ): Promise<void> {
        const mergedTokens: StoredTokens = {
            ...existing,
            access_token: tokens.access_token,
            ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
            ...(tokens.id_token && { id_token: tokens.id_token }),
        };

        await this.prisma.solidConnection.update({
            where: { userId: this.userId },
            data: {
                encryptedTokens: encryptTokens(mergedTokens),
                tokenExpiry,
            },
        });
    }

    /**
     * Get resource as JSON
     * @param url - Resource URL
     * @returns Parsed JSON
     * @throws {SolidPodError} with `status` set for non-2xx responses
     */
    async getJson<T = unknown>(url: string): Promise<T> {
        const response = await this.fetch(url, {
            headers: {
                'Accept': 'application/json, application/ld+json',
            },
        });

        if (!response.ok) {
            throw httpError(response.status);
        }

        return await response.json() as T;
    }

    /**
     * Put resource as JSON
     * @param url - Resource URL
     * @param data - Data to write
     * @throws {SolidPodError} with `status` set for non-2xx responses
     */
    async putJson(url: string, data: unknown): Promise<void> {
        const response = await this.fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw httpError(response.status);
        }
    }
}

function httpError(status: number): SolidPodError {
    return new SolidPodError('http', `Pod request failed with HTTP ${status}`, status);
}

function readStoredTokens(encrypted: string): StoredTokens {
    return decryptTokens(encrypted) as StoredTokens;
}

/**
 * Create Solid client for a user
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param prisma - Application Prisma client (from GraphQLContext)
 * @returns Solid client instance
 */
export function createSolidClient(
    userId: string,
    clientId: string,
    prisma: PrismaClient
): SolidClient {
    return new SolidClient({ userId, clientId, prisma });
}

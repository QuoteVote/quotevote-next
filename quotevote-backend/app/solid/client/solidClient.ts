import { refreshAccessToken, type TokenResponse } from '../oidc/authorization';
import { SolidConnection } from '../../data/models/SolidConnection';
import { encryptTokens, decryptTokens } from '../storage/encryption';

/**
 * Solid Client for authenticated fetch operations
 * Handles token refresh and authenticated requests to Solid Pods
 */

export interface SolidFetchOptions extends RequestInit {
    timeout?: number;
}

export interface SolidClientConfig {
    userId: string;
    clientId: string;
}

/**
 * Solid Client class for making authenticated requests
 */
export class SolidClient {
    private userId: string;
    private clientId: string;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor(config: SolidClientConfig) {
        this.userId = config.userId;
        this.clientId = config.clientId;
    }

    /**
     * Make authenticated fetch request to Solid Pod
     * @param url - Resource URL
     * @param options - Fetch options
     * @returns Response
     */
    async fetch(url: string, options: SolidFetchOptions = {}): Promise<Response> {
        const { timeout = 10000, ...fetchOptions } = options;

        // Ensure we have a valid access token
        await this.ensureValidToken();

        if (!this.accessToken) {
            throw new Error('No valid access token available');
        }

        // Add authorization header
        const headers = new Headers(fetchOptions.headers);
        headers.set('Authorization', `Bearer ${this.accessToken}`);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: AbortSignal.timeout(timeout),
            });

            // If 401, try to refresh token and retry once
            if (response.status === 401) {
                await this.refreshToken();

                if (!this.accessToken) {
                    throw new Error('Token refresh failed');
                }

                headers.set('Authorization', `Bearer ${this.accessToken}`);

                return await fetch(url, {
                    ...fetchOptions,
                    headers,
                    signal: AbortSignal.timeout(timeout),
                });
            }

            return response;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Solid fetch failed for ${url}: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Ensure we have a valid access token
     */
    private async ensureValidToken(): Promise<void> {
        // If we have a token and it's not expired, use it
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return;
        }

        // Load token from database
        await this.loadTokenFromDatabase();

        // If token is expired or about to expire (within 5 minutes), refresh it
        if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
            await this.refreshToken();
        }
    }

    /**
     * Load token from database
     */
    private async loadTokenFromDatabase(): Promise<void> {
        const connection = await SolidConnection.findOne({ userId: this.userId });

        if (!connection) {
            throw new Error('No Solid connection found for user');
        }

        const tokens = decryptTokens(connection.encryptedTokens) as {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
        };

        this.accessToken = tokens.access_token;
        this.tokenExpiry = connection.tokenExpiry || null;
    }

    /**
     * Refresh access token
     */
    private async refreshToken(): Promise<void> {
        const connection = await SolidConnection.findOne({ userId: this.userId });

        if (!connection) {
            throw new Error('No Solid connection found for user');
        }

        const tokens = decryptTokens(connection.encryptedTokens) as {
            access_token: string;
            refresh_token?: string;
        };

        if (!tokens.refresh_token) {
            throw new Error('No refresh token available');
        }

        try {
            const newTokens = await refreshAccessToken(
                tokens.refresh_token,
                connection.issuer,
                this.clientId
            );

            // Update tokens in memory
            this.accessToken = newTokens.access_token;

            // Calculate token expiry
            const expiresIn = newTokens.expires_in || 3600; // Default 1 hour
            this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

            // Update tokens in database
            await this.saveTokensToDatabase(newTokens);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Token refresh failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Save tokens to database
     */
    private async saveTokensToDatabase(tokens: TokenResponse): Promise<void> {
        const connection = await SolidConnection.findOne({ userId: this.userId });

        if (!connection) {
            throw new Error('No Solid connection found for user');
        }

        // Merge new tokens with existing ones (preserve refresh_token if not provided)
        const existingTokens = decryptTokens(connection.encryptedTokens) as Record<string, unknown>;
        const mergedTokens = {
            ...existingTokens,
            access_token: tokens.access_token,
            ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
            ...(tokens.id_token && { id_token: tokens.id_token }),
        };

        const encryptedTokens = encryptTokens(mergedTokens);

        // Calculate token expiry
        const expiresIn = tokens.expires_in || 3600;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

        connection.encryptedTokens = encryptedTokens;
        connection.tokenExpiry = tokenExpiry;

        await connection.save();
    }

    /**
     * Get resource as JSON
     * @param url - Resource URL
     * @returns Parsed JSON
     */
    async getJson<T = unknown>(url: string): Promise<T> {
        const response = await this.fetch(url, {
            headers: {
                'Accept': 'application/json, application/ld+json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    /**
     * Put resource as JSON
     * @param url - Resource URL
     * @param data - Data to write
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
            throw new Error(`Failed to write resource: ${response.status} ${response.statusText}`);
        }
    }
}

/**
 * Create Solid client for a user
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @returns Solid client instance
 */
export function createSolidClient(userId: string, clientId: string): SolidClient {
    return new SolidClient({ userId, clientId });
}

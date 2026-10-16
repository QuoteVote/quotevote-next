import { GraphQLError } from 'graphql';
import type { Prisma } from '@prisma/client';
import type { GraphQLContext } from '~/types/graphql';
import { logger } from '~/data/utils/logger';
import {
    exchangeCodeForTokens,
    generateAuthorizationUrl,
} from '~/solid/oidc/authorization';
import { discoverIssuer, validateIssuerUrl } from '~/solid/oidc/discovery';
import { verifyIdToken } from '~/solid/oidc/security';
import { encryptTokens, decryptTokens } from '~/solid/storage/encryption';
import {
    pullPortableState,
    pushPortableState,
    appendActivityEvent,
} from '~/solid/sync/syncService';
import {
    SolidInvalidInputError,
    SolidNotConnectedError,
    SolidOidcError,
    SolidPodError,
    SolidFeatureDisabledError,
} from '~/solid/errors';
import type { PortableStateInput, ActivityEventInput } from '~/solid/schemas/portable';

/**
 * GraphQL Resolvers for Solid Pod Integration
 *
 * - Every operation is scoped to `context.userId`; no resolver accepts a user id from the client.
 * - Errors are GraphQLErrors with generic messages and a stable `extensions.code`:
 *   UNAUTHENTICATED, BAD_USER_INPUT, SOLID_REAUTH_REQUIRED, SOLID_UNAVAILABLE.
 *   Messages never contain tokens, authorization codes, verifiers or provider bodies.
 */

/** Authorization state (CSRF + PKCE binding) lifetime */
const AUTH_STATE_TTL_MS = 10 * 60 * 1000;
const SOLID_SCOPE = 'openid profile offline_access';
const DEFAULT_EXPIRES_IN_SECONDS = 3600;

const MSG_INVALID_REQUEST = 'Authorization request is invalid or has expired. Please try connecting again.';
const MSG_REAUTH = 'Your Solid Pod session has expired. Please reconnect your Solid Pod.';
const MSG_UNAVAILABLE = 'The Solid Pod service is unavailable. Please try again later.';
const MSG_NOT_CONNECTED = 'No Solid Pod is connected to this account.';

function getClientId(): string {
    return process.env.SOLID_CLIENT_ID || 'quotevote-backend';
}

/**
 * Frontend page that receives the OIDC redirect (not the backend).
 */
function getFrontendCallbackUri(): string {
    const base = process.env.SOLID_REDIRECT_URI_BASE || process.env.CLIENT_URL || 'http://localhost:3000';
    return `${base.replace(/\/+$/, '')}/settings/solid/callback`;
}

function graphQLError(code: string, message: string): GraphQLError {
    return new GraphQLError(message, { extensions: { code } });
}

function requireUserId(context: GraphQLContext): string {
    if (!context.userId) {
        throw graphQLError('UNAUTHENTICATED', 'Authentication required');
    }
    return context.userId;
}

/**
 * Normalise any failure from Solid/Pod/OIDC code into a GraphQLError.
 * Only error classes and status codes are inspected; raw messages are not forwarded.
 */
function toSolidGraphQLError(error: unknown, operation: string): GraphQLError {
    if (error instanceof GraphQLError) {
        return error;
    }
    if (error instanceof SolidNotConnectedError) {
        return graphQLError('BAD_USER_INPUT', MSG_NOT_CONNECTED);
    }
    if (error instanceof SolidInvalidInputError) {
        return graphQLError('BAD_USER_INPUT', error.message);
    }
    if (error instanceof SolidOidcError && error.code === 'invalid_grant') {
        return graphQLError('SOLID_REAUTH_REQUIRED', MSG_REAUTH);
    }
    if (error instanceof SolidPodError && error.status === 401) {
        return graphQLError('SOLID_REAUTH_REQUIRED', MSG_REAUTH);
    }

    // Log only the class name and status, never the message (it may contain provider details).
    logger.warn('Solid operation failed', {
        operation,
        errorName: error instanceof Error ? error.name : typeof error,
        status: error instanceof SolidPodError || error instanceof SolidOidcError ? error.status : undefined,
        kind: error instanceof SolidPodError ? error.kind : undefined,
        oidcCode: error instanceof SolidOidcError ? error.code : undefined,
        feature: error instanceof SolidFeatureDisabledError ? 'activity-ledger' : undefined,
    });
    return graphQLError('SOLID_UNAVAILABLE', MSG_UNAVAILABLE);
}

/**
 * Accept only absolute http(s) URLs as WebIDs.
 */
function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function readVerifier(encrypted: string): string {
    const decrypted = decryptTokens(encrypted);
    if (typeof decrypted.codeVerifier !== 'string' || decrypted.codeVerifier === '') {
        throw new Error('Stored PKCE verifier is malformed');
    }
    return decrypted.codeVerifier;
}

export const solidResolvers = {
    Query: {
        /**
         * Get Solid connection status for current user
         */
        solidConnectionStatus: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
            const userId = requireUserId(context);

            const connection = await context.prisma.solidConnection.findUnique({
                where: { userId },
                select: { webId: true, issuer: true, lastSyncAt: true },
            });

            if (!connection) {
                return {
                    connected: false,
                    webId: null,
                    issuer: null,
                    lastSyncAt: null,
                };
            }

            return {
                connected: true,
                webId: connection.webId,
                issuer: connection.issuer,
                lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
            };
        },
    },

    Mutation: {
        /**
         * Start Solid connection flow: stores state + encrypted PKCE verifier bound to this user.
         */
        solidStartConnect: async (
            _parent: unknown,
            args: { issuer: string },
            context: GraphQLContext
        ) => {
            const userId = requireUserId(context);

            const issuer = typeof args.issuer === 'string' ? args.issuer.trim() : '';
            if (!issuer || !validateIssuerUrl(issuer)) {
                throw graphQLError(
                    'BAD_USER_INPUT',
                    'Issuer must be a valid https URL (http is allowed only for localhost in development)'
                );
            }

            const redirectUri = getFrontendCallbackUri();

            try {
                await context.prisma.solidAuthState.deleteMany({
                    where: { expiresAt: { lt: new Date() } },
                });

                const result = await generateAuthorizationUrl({
                    issuer,
                    clientId: getClientId(),
                    redirectUri,
                    scope: SOLID_SCOPE,
                });

                if (!result.codeVerifier) {
                    throw new Error('PKCE verifier was not generated');
                }

                await context.prisma.solidAuthState.create({
                    data: {
                        state: result.state,
                        userId,
                        issuer,
                        redirectUri,
                        encryptedVerifier: encryptTokens({ codeVerifier: result.codeVerifier }),
                        expiresAt: new Date(Date.now() + AUTH_STATE_TTL_MS),
                    },
                });

                return { authorizationUrl: result.authorizationUrl };
            } catch (error) {
                throw toSolidGraphQLError(error, 'solidStartConnect');
            }
        },

        /**
         * Finish Solid connection flow: validates and consumes the stored state, exchanges the code,
         * and upserts the user's single connection.
         */
        solidFinishConnect: async (
            _parent: unknown,
            args: { code: string; state: string; redirectUri: string },
            context: GraphQLContext
        ) => {
            const userId = requireUserId(context);
            const { code, state, redirectUri } = args;

            if (!code || !state || !redirectUri) {
                throw graphQLError('BAD_USER_INPUT', MSG_INVALID_REQUEST);
            }

            const authState = await context.prisma.solidAuthState.findUnique({ where: { state } });

            // Unknown state and another user's state get the same response (no oracle).
            if (!authState || authState.userId !== userId) {
                throw graphQLError('BAD_USER_INPUT', MSG_INVALID_REQUEST);
            }

            // Single use: claim the row before any other check so it cannot be replayed.
            const claimed = await context.prisma.solidAuthState.deleteMany({
                where: { state, userId },
            });
            if (claimed.count !== 1) {
                throw graphQLError('BAD_USER_INPUT', MSG_INVALID_REQUEST);
            }

            if (authState.expiresAt.getTime() <= Date.now() || authState.redirectUri !== redirectUri) {
                throw graphQLError('BAD_USER_INPUT', MSG_INVALID_REQUEST);
            }

            try {
                const codeVerifier = readVerifier(authState.encryptedVerifier);

                const tokens = await exchangeCodeForTokens(
                    code,
                    codeVerifier,
                    redirectUri,
                    authState.issuer,
                    getClientId()
                );

                if (!tokens.id_token) {
                    throw new SolidOidcError('invalid_response', 'Token response has no id_token');
                }

                // Verify signature (issuer JWKS), issuer, audience and expiry before trusting any claim.
                const metadata = await discoverIssuer(authState.issuer);
                let claims: Record<string, unknown>;
                try {
                    claims = await verifyIdToken(tokens.id_token, {
                        issuer: authState.issuer,
                        clientId: getClientId(),
                        jwksUri: metadata.jwks_uri,
                    });
                } catch {
                    throw new SolidOidcError('invalid_response', 'ID token verification failed');
                }
                const candidate =
                    typeof claims.webid === 'string' && claims.webid
                        ? claims.webid
                        : typeof claims.sub === 'string'
                            ? claims.sub
                            : '';
                if (!isHttpUrl(candidate)) {
                    throw new SolidOidcError('invalid_response', 'ID token does not contain a valid WebID');
                }
                const webId = candidate;

                // Keep only the claims the connection needs.
                const minimalClaims: Prisma.InputJsonObject = {
                    webid: webId,
                    ...(typeof claims.sub === 'string' && { sub: claims.sub }),
                    ...(typeof claims.iss === 'string' && { iss: claims.iss }),
                    ...(typeof claims.aud === 'string' && { aud: claims.aud }),
                    ...(typeof claims.exp === 'number' && { exp: claims.exp }),
                };

                const encryptedTokens = encryptTokens({
                    access_token: tokens.access_token,
                    ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
                    id_token: tokens.id_token,
                });
                const tokenExpiry = new Date(
                    Date.now() + (tokens.expires_in || DEFAULT_EXPIRES_IN_SECONDS) * 1000
                );
                const scopes = tokens.scope ? tokens.scope.split(' ').filter(Boolean) : [];

                // Reconnect replaces tokens and resets derived Pod URIs and sync time.
                await context.prisma.solidConnection.upsert({
                    where: { userId },
                    create: {
                        userId,
                        webId,
                        issuer: authState.issuer,
                        encryptedTokens,
                        scopes,
                        idTokenClaims: minimalClaims,
                        tokenExpiry,
                    },
                    update: {
                        webId,
                        issuer: authState.issuer,
                        encryptedTokens,
                        scopes,
                        idTokenClaims: minimalClaims,
                        tokenExpiry,
                        resourceUris: null,
                        lastSyncAt: null,
                    },
                });

                return {
                    success: true,
                    webId,
                    issuer: authState.issuer,
                    message: 'Solid Pod connected successfully',
                };
            } catch (error) {
                throw toSolidGraphQLError(error, 'solidFinishConnect');
            }
        },

        /**
         * Disconnect Solid Pod: removes only the caller's connection and pending states.
         */
        solidDisconnect: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
            const userId = requireUserId(context);

            await context.prisma.solidConnection.deleteMany({ where: { userId } });
            await context.prisma.solidAuthState.deleteMany({ where: { userId } });

            return true;
        },

        /**
         * Pull portable state from Solid Pod (returned to the caller; nothing is applied locally)
         */
        solidPullPortableState: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
            const userId = requireUserId(context);

            try {
                return await pullPortableState(userId, getClientId(), context.prisma);
            } catch (error) {
                throw toSolidGraphQLError(error, 'solidPullPortableState');
            }
        },

        /**
         * Push portable state to Solid Pod
         */
        solidPushPortableState: async (
            _parent: unknown,
            args: { input: PortableStateInput },
            context: GraphQLContext
        ) => {
            const userId = requireUserId(context);

            try {
                return await pushPortableState(userId, getClientId(), args.input, context.prisma);
            } catch (error) {
                throw toSolidGraphQLError(error, 'solidPushPortableState');
            }
        },

        /**
         * Append activity event to ledger (feature-flagged)
         */
        solidAppendActivityEvent: async (
            _parent: unknown,
            args: { input: Omit<ActivityEventInput, 'payload'> & { payload: string | Record<string, unknown> } },
            context: GraphQLContext
        ) => {
            const userId = requireUserId(context);

            let payload: Record<string, unknown>;
            try {
                const raw: unknown = args.input.payload;
                const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('payload must be an object');
                }
                payload = parsed as Record<string, unknown>;
            } catch {
                throw graphQLError('BAD_USER_INPUT', 'Activity payload must be a JSON object');
            }

            try {
                return await appendActivityEvent(
                    userId,
                    getClientId(),
                    { ...args.input, payload },
                    context.prisma
                );
            } catch (error) {
                throw toSolidGraphQLError(error, 'solidAppendActivityEvent');
            }
        },
    },
};

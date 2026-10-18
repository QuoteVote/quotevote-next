import crypto from 'crypto';
import { GraphQLError } from 'graphql';
import type { PrismaClient } from '@prisma/client';
import type { GraphQLContext } from '~/types/graphql';
import { solidResolvers } from '~/data/resolvers/solidResolvers';
import {
    exchangeCodeForTokens,
    generateAuthorizationUrl,
} from '~/solid/oidc/authorization';
import {
    pullPortableState,
    pushPortableState,
    appendActivityEvent,
} from '~/solid/sync/syncService';
import { assertWebIdListsIssuer } from '~/solid/oidc/webid';
import { decryptTokens, encryptTokens } from '~/solid/storage/encryption';
import { SolidOidcError, SolidPodError, SolidNotConnectedError } from '~/solid/errors';

jest.mock('~/data/utils/logger', () => ({
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('~/solid/oidc/authorization', () => ({
    ...jest.requireActual('~/solid/oidc/authorization'),
    generateAuthorizationUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
}));

jest.mock('~/solid/oidc/discovery', () => ({
    ...jest.requireActual('~/solid/oidc/discovery'),
    discoverIssuer: jest.fn().mockResolvedValue({ jwks_uri: 'https://issuer.example/jwks' }),
}));

jest.mock('~/solid/oidc/security', () => ({
    // Signature verification is covered in security.test.ts; here only decode the claims.
    verifyIdToken: jest.fn(async (token: string) =>
        JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    ),
}));

jest.mock('~/solid/oidc/webid', () => ({
    ...jest.requireActual('~/solid/oidc/webid'),
    assertWebIdListsIssuer: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('~/solid/sync/syncService', () => ({
    pullPortableState: jest.fn(),
    pushPortableState: jest.fn(),
    appendActivityEvent: jest.fn(),
}));

type Row = Record<string, unknown>;

const USER_A = '507f1f77bcf86cd799439011';
const USER_B = '507f1f77bcf86cd799439022';
const REDIRECT = 'http://localhost:3000/settings/solid/callback';
const ISSUER = 'https://issuer.example';
const CLIENT_ID = 'https://app.example/solid/client-id.json';
const WEBID_A = 'https://pod-a.example/profile/card#me';
const WEBID_B = 'https://pod-b.example/profile/card#me';

function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, cond]) => {
        if (cond && typeof cond === 'object' && 'lt' in cond) {
            return (row[key] as Date).getTime() < (cond as { lt: Date }).lt.getTime();
        }
        return row[key] === cond;
    });
}

/**
 * In-memory stand-in for the two Solid Prisma delegates. Only the calls used by the resolvers are implemented.
 */
function createFakePrisma() {
    const authStates = new Map<string, Row>();
    const connections = new Map<string, Row>();

    const prisma = {
        solidAuthState: {
            create: jest.fn(async ({ data }: { data: Row }) => {
                authStates.set(String(data.state), { ...data });
                return { ...data };
            }),
            findUnique: jest.fn(async ({ where }: { where: { state: string } }) => {
                const row = authStates.get(where.state);
                return row ? { ...row } : null;
            }),
            deleteMany: jest.fn(async ({ where }: { where: Row }) => {
                let count = 0;
                for (const [key, row] of [...authStates]) {
                    if (matches(row, where)) {
                        authStates.delete(key);
                        count += 1;
                    }
                }
                return { count };
            }),
        },
        solidConnection: {
            findUnique: jest.fn(async ({ where, select }: { where: Row; select?: Record<string, boolean> }) => {
                const row = connections.get(String(where.userId));
                if (!row) {
                    return null;
                }
                if (!select) {
                    return { ...row };
                }
                return Object.fromEntries(Object.keys(select).map((k) => [k, row[k] ?? null]));
            }),
            upsert: jest.fn(async ({ where, create, update }: { where: Row; create: Row; update: Row }) => {
                const key = String(where.userId);
                const next = connections.has(key)
                    ? { ...connections.get(key), ...update }
                    : { ...create, createdAt: new Date() };
                connections.set(key, next);
                return { ...next };
            }),
            deleteMany: jest.fn(async ({ where }: { where: Row }) => {
                let count = 0;
                for (const [key, row] of [...connections]) {
                    if (matches(row, where)) {
                        connections.delete(key);
                        count += 1;
                    }
                }
                return { count };
            }),
        },
    };

    return { prisma, authStates, connections };
}

function makeContext(prisma: unknown, userId: string | null): GraphQLContext {
    return {
        prisma: prisma as PrismaClient,
        userId,
        user: null,
        req: {},
        res: {},
        pubsub: {},
        requestId: 'test-request',
    } as unknown as GraphQLContext;
}

function encryptForTest(data: Record<string, unknown>): string {
    return encryptTokens(data);
}

function makeIdToken(claims: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    return `${header}.${payload}.signature`;
}

async function captureError(promise: Promise<unknown>): Promise<GraphQLError> {
    try {
        await promise;
    } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        return error as GraphQLError;
    }
    throw new Error('Expected the resolver to reject');
}

const codeOf = (error: GraphQLError): unknown => error.extensions?.code;

// Resolver shortcuts
const R = solidResolvers;
const startConnect = (ctx: GraphQLContext, issuer = ISSUER) =>
    R.Mutation.solidStartConnect(undefined, { issuer }, ctx);
const finishConnect = (ctx: GraphQLContext, args: { code: string; state: string; redirectUri?: string }) =>
    R.Mutation.solidFinishConnect(
        undefined,
        { code: args.code, state: args.state, redirectUri: args.redirectUri ?? REDIRECT },
        ctx
    );

describe('solidResolvers (Prisma-backed OIDC lifecycle)', () => {
    let store: ReturnType<typeof createFakePrisma>;
    let stateCounter: number;

    beforeAll(() => {
        process.env.SOLID_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.CLIENT_URL;
        delete process.env.SOLID_REDIRECT_URI_BASE;
        process.env.SOLID_CLIENT_ID = CLIENT_ID;

        store = createFakePrisma();
        stateCounter = 0;

        (generateAuthorizationUrl as jest.Mock).mockImplementation(async () => {
            stateCounter += 1;
            return {
                authorizationUrl: `${ISSUER}/authorize?state=STATE-${stateCounter}`,
                state: `STATE-${stateCounter}`,
                codeVerifier: `VERIFIER-${stateCounter}`,
            };
        });

        (exchangeCodeForTokens as jest.Mock).mockResolvedValue({
            access_token: 'ACCESS-TOKEN-A',
            refresh_token: 'REFRESH-TOKEN-A',
            id_token: makeIdToken({ sub: WEBID_A, webid: WEBID_A, iss: ISSUER, aud: CLIENT_ID, exp: 9999999999 }),
            token_type: 'DPoP',
            expires_in: 600,
            scope: 'openid offline_access webid',
        });
    });

    const ctxA = () => makeContext(store.prisma, USER_A);
    const ctxB = () => makeContext(store.prisma, USER_B);

    describe('solidStartConnect', () => {
        it('stores state, user binding, redirect URI and an encrypted PKCE verifier', async () => {
            const result = await startConnect(ctxA());

            expect(result).toEqual({ authorizationUrl: `${ISSUER}/authorize?state=STATE-1` });
            expect(generateAuthorizationUrl).toHaveBeenCalledWith(
                expect.objectContaining({ issuer: ISSUER, clientId: CLIENT_ID, redirectUri: REDIRECT })
            );

            const row = store.authStates.get('STATE-1');
            expect(row).toMatchObject({ state: 'STATE-1', userId: USER_A, issuer: ISSUER, redirectUri: REDIRECT });
            expect(String(row?.encryptedVerifier)).not.toContain('VERIFIER-1');
            expect(decryptTokens(String(row?.encryptedVerifier))).toMatchObject({
                codeVerifier: 'VERIFIER-1',
                dpopPrivateJwk: expect.objectContaining({ kty: 'EC', crv: 'P-256', d: expect.any(String) }),
                dpopPublicJwk: expect.objectContaining({ kty: 'EC', crv: 'P-256' }),
            });
            expect(decryptTokens(String(row?.encryptedVerifier)).dpopPublicJwk).not.toHaveProperty('d');

            const ttl = (row?.expiresAt as Date).getTime() - Date.now();
            expect(ttl).toBeGreaterThan(9 * 60 * 1000);
            expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000);
        });

        it('uses the frontend callback page derived from SOLID_REDIRECT_URI_BASE / CLIENT_URL', async () => {
            process.env.SOLID_REDIRECT_URI_BASE = 'https://app.quote.vote/';
            await startConnect(ctxA());
            expect(generateAuthorizationUrl).toHaveBeenLastCalledWith(
                expect.objectContaining({ redirectUri: 'https://app.quote.vote/settings/solid/callback' })
            );
        });

        it('prunes expired authorization states', async () => {
            store.authStates.set('OLD', {
                state: 'OLD',
                userId: USER_A,
                issuer: ISSUER,
                redirectUri: REDIRECT,
                encryptedVerifier: 'x',
                expiresAt: new Date(Date.now() - 1000),
            });

            await startConnect(ctxA());

            expect(store.authStates.has('OLD')).toBe(false);
            expect(store.authStates.has('STATE-1')).toBe(true);
        });

        it.each([
            ['plain http for a public host', 'http://example.com'],
            ['a non-http scheme', 'javascript:alert(1)'],
            ['an unparseable value', 'not a url'],
        ])('rejects %s with BAD_USER_INPUT', async (_label, issuer) => {
            const error = await captureError(startConnect(ctxA(), issuer));
            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(generateAuthorizationUrl).not.toHaveBeenCalled();
        });

        it('allows http for localhost in development', async () => {
            await expect(startConnect(ctxA(), 'http://localhost:4000')).resolves.toBeDefined();
        });

        it('requests the scopes needed for a WebID-bound DPoP session', async () => {
            await startConnect(ctxA());
            expect(generateAuthorizationUrl).toHaveBeenCalledWith(
                expect.objectContaining({ scope: 'openid offline_access webid' })
            );
        });

        it('fails with SOLID_UNAVAILABLE and never calls the provider when SOLID_CLIENT_ID is unset', async () => {
            delete process.env.SOLID_CLIENT_ID;

            const error = await captureError(startConnect(ctxA()));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(error.message).not.toMatch(/SOLID_CLIENT_ID/);
            expect(generateAuthorizationUrl).not.toHaveBeenCalled();
        });

        it.each([
            ['a non-https public URL', 'http://app.example/solid/client-id.json'],
            ['a value that is not a URL', 'quotevote-backend'],
        ])('fails with SOLID_UNAVAILABLE for SOLID_CLIENT_ID as %s', async (_label, value) => {
            process.env.SOLID_CLIENT_ID = value;

            const error = await captureError(startConnect(ctxA()));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(generateAuthorizationUrl).not.toHaveBeenCalled();
        });

        it('accepts http://localhost as SOLID_CLIENT_ID outside production', async () => {
            process.env.SOLID_CLIENT_ID = 'http://localhost:3000/solid/client-id.json';
            await expect(startConnect(ctxA())).resolves.toBeDefined();
            expect(generateAuthorizationUrl).toHaveBeenCalledWith(
                expect.objectContaining({ clientId: 'http://localhost:3000/solid/client-id.json' })
            );
        });

        it('requires authentication', async () => {
            const error = await captureError(startConnect(makeContext(store.prisma, null)));
            expect(codeOf(error)).toBe('UNAUTHENTICATED');
        });
    });

    describe('solidFinishConnect', () => {
        it('completes the flow, stores encrypted tokens and minimal claims, and consumes the state', async () => {
            await startConnect(ctxA());

            const result = await finishConnect(ctxA(), { code: 'CODE-1', state: 'STATE-1' });

            expect(result).toEqual({
                success: true,
                webId: WEBID_A,
                issuer: ISSUER,
                message: 'Solid Pod connected successfully',
            });
            expect(exchangeCodeForTokens).toHaveBeenCalledWith(
                'CODE-1',
                'VERIFIER-1',
                REDIRECT,
                ISSUER,
                CLIENT_ID,
                expect.objectContaining({ privateJwk: expect.any(Object), publicJwk: expect.any(Object) })
            );
            expect(assertWebIdListsIssuer).toHaveBeenCalledWith(WEBID_A, ISSUER);

            const connection = store.connections.get(USER_A);
            expect(connection).toMatchObject({ webId: WEBID_A, issuer: ISSUER, scopes: ['openid', 'offline_access', 'webid'] });
            expect(decryptTokens(String(connection?.encryptedTokens))).toMatchObject({
                access_token: 'ACCESS-TOKEN-A',
                refresh_token: 'REFRESH-TOKEN-A',
                token_type: 'DPoP',
                dpop_private_jwk: expect.objectContaining({ kty: 'EC', d: expect.any(String) }),
                dpop_public_jwk: expect.objectContaining({ kty: 'EC', crv: 'P-256' }),
            });
            expect(Object.keys(connection?.idTokenClaims as object).sort()).toEqual(['aud', 'exp', 'iss', 'sub', 'webid']);
            expect(connection?.tokenExpiry).toBeInstanceOf(Date);

            expect(store.authStates.has('STATE-1')).toBe(false);
        });

        it('falls back to the sub claim when webid is absent', async () => {
            (exchangeCodeForTokens as jest.Mock).mockResolvedValueOnce({
                access_token: 'a',
                id_token: makeIdToken({ sub: WEBID_A }),
                token_type: 'Bearer',
            });
            await startConnect(ctxA());

            const result = await finishConnect(ctxA(), { code: 'C', state: 'STATE-1' });

            expect(result).toMatchObject({ webId: WEBID_A });
        });

        it('replaces the connection on reconnect and resets derived Pod URIs', async () => {
            store.connections.set(USER_A, {
                userId: USER_A,
                webId: 'https://old.example/profile#me',
                issuer: ISSUER,
                encryptedTokens: 'old',
                resourceUris: { profile: 'https://old.example/p' },
                lastSyncAt: new Date(),
            });
            await startConnect(ctxA());

            await finishConnect(ctxA(), { code: 'C', state: 'STATE-1' });

            const connection = store.connections.get(USER_A);
            expect(connection?.webId).toBe(WEBID_A);
            expect(connection?.resourceUris).toBeNull();
            expect(connection?.lastSyncAt).toBeNull();
        });

        it('rejects an unknown state with a generic BAD_USER_INPUT and never calls the provider', async () => {
            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'NOPE' }));

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(exchangeCodeForTokens).not.toHaveBeenCalled();
        });

        it('rejects an expired state and deletes it', async () => {
            await startConnect(ctxA());
            store.authStates.get('STATE-1')!.expiresAt = new Date(Date.now() - 1000);

            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(store.authStates.has('STATE-1')).toBe(false);
            expect(exchangeCodeForTokens).not.toHaveBeenCalled();
        });

        it("rejects another user's state without consuming it, so the owner can still finish", async () => {
            await startConnect(ctxA());

            const error = await captureError(finishConnect(ctxB(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(exchangeCodeForTokens).not.toHaveBeenCalled();
            expect(store.authStates.has('STATE-1')).toBe(true);

            await expect(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' })).resolves.toMatchObject({ success: true });
        });

        it('rejects a redirectUri mismatch and consumes the state', async () => {
            await startConnect(ctxA());

            const error = await captureError(
                finishConnect(ctxA(), { code: 'C', state: 'STATE-1', redirectUri: 'https://evil.example/cb' })
            );

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(exchangeCodeForTokens).not.toHaveBeenCalled();
            expect(store.authStates.has('STATE-1')).toBe(false);
        });

        it('treats the state as single use', async () => {
            await startConnect(ctxA());
            await finishConnect(ctxA(), { code: 'C1', state: 'STATE-1' });

            const error = await captureError(finishConnect(ctxA(), { code: 'C2', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
            expect(exchangeCodeForTokens).toHaveBeenCalledTimes(1);
        });

        it('maps a rejected authorization code (invalid_grant) to SOLID_REAUTH_REQUIRED', async () => {
            await startConnect(ctxA());
            (exchangeCodeForTokens as jest.Mock).mockRejectedValueOnce(
                new SolidOidcError('invalid_grant', 'Authorization grant was rejected', 400)
            );

            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('SOLID_REAUTH_REQUIRED');
        });

        it.each([
            ['a non-URL value', 'javascript:alert(1)'],
            ['a plain http WebID', 'http://pod-a.example/profile/card#me'],
        ])('rejects an ID token with %s as SOLID_UNAVAILABLE without fetching the profile', async (_label, webid) => {
            (exchangeCodeForTokens as jest.Mock).mockResolvedValueOnce({
                access_token: 'a',
                id_token: makeIdToken({ sub: webid }),
                token_type: 'DPoP',
            });
            await startConnect(ctxA());

            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(assertWebIdListsIssuer).not.toHaveBeenCalled();
            expect(store.connections.has(USER_A)).toBe(false);
        });

        it('rejects a WebID whose profile does not list the token issuer as SOLID_UNAVAILABLE', async () => {
            (assertWebIdListsIssuer as jest.Mock).mockRejectedValueOnce(
                new SolidOidcError('invalid_response', 'WebID does not list the token issuer')
            );
            await startConnect(ctxA());

            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(store.connections.has(USER_A)).toBe(false);
        });

        it('fails with SOLID_UNAVAILABLE when the stored state has no DPoP key', async () => {
            await startConnect(ctxA());
            const row = store.authStates.get('STATE-1')!;
            row.encryptedVerifier = encryptForTest({ codeVerifier: 'VERIFIER-1' });

            const error = await captureError(finishConnect(ctxA(), { code: 'C', state: 'STATE-1' }));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(exchangeCodeForTokens).not.toHaveBeenCalled();
        });

        it('binds the tokens to the DPoP key created at start (same public key in the proof and the stored blob)', async () => {
            await startConnect(ctxA());
            const stored = decryptTokens(String(store.authStates.get('STATE-1')!.encryptedVerifier));

            await finishConnect(ctxA(), { code: 'C', state: 'STATE-1' });

            const dpopArg = (exchangeCodeForTokens as jest.Mock).mock.calls[0][5];
            expect(dpopArg.publicJwk).toEqual(stored.dpopPublicJwk);
            expect(dpopArg.privateJwk).toEqual(stored.dpopPrivateJwk);
        });

        it('never leaks the code, verifier, tokens or provider body in errors', async () => {
            await startConnect(ctxA());
            (exchangeCodeForTokens as jest.Mock).mockRejectedValueOnce(
                new SolidOidcError('provider_error', 'Token endpoint returned HTTP 500', 500)
            );

            const error = await captureError(finishConnect(ctxA(), { code: 'CODE-SECRET-123', state: 'STATE-1' }));

            const serialized = JSON.stringify({ message: error.message, extensions: error.extensions });
            expect(serialized).not.toMatch(/CODE-SECRET|VERIFIER|ACCESS-TOKEN|REFRESH-TOKEN/);
            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
        });
    });

    describe('solidConnectionStatus', () => {
        it('never returns another user’s connection', async () => {
            store.connections.set(USER_B, {
                userId: USER_B,
                webId: WEBID_B,
                issuer: ISSUER,
                lastSyncAt: new Date('2026-01-01T00:00:00.000Z'),
            });

            const status = await R.Query.solidConnectionStatus(undefined, {}, ctxA());

            expect(status).toEqual({ connected: false, webId: null, issuer: null, lastSyncAt: null });
        });

        it('returns the caller’s own connection', async () => {
            store.connections.set(USER_A, {
                userId: USER_A,
                webId: WEBID_A,
                issuer: ISSUER,
                lastSyncAt: new Date('2026-01-01T00:00:00.000Z'),
            });

            const status = await R.Query.solidConnectionStatus(undefined, {}, ctxA());

            expect(status).toEqual({
                connected: true,
                webId: WEBID_A,
                issuer: ISSUER,
                lastSyncAt: '2026-01-01T00:00:00.000Z',
            });
        });
    });

    describe('solidDisconnect', () => {
        it('removes only the caller’s connection', async () => {
            store.connections.set(USER_A, { userId: USER_A, webId: WEBID_A, issuer: ISSUER });
            store.connections.set(USER_B, { userId: USER_B, webId: WEBID_B, issuer: ISSUER });

            const result = await R.Mutation.solidDisconnect(undefined, {}, ctxA());

            expect(result).toBe(true);
            expect(store.connections.has(USER_A)).toBe(false);
            expect(store.connections.has(USER_B)).toBe(true);
        });
    });

    describe('Pod operations', () => {
        it('scopes pull to the authenticated user', async () => {
            (pullPortableState as jest.Mock).mockResolvedValue({ portableSchemaVersion: '0' });

            await R.Query.solidPullPortableState(undefined, {}, ctxA());

            expect(pullPortableState).toHaveBeenCalledWith(USER_A, CLIENT_ID, store.prisma);
        });

        it('scopes push to the authenticated user', async () => {
            (pushPortableState as jest.Mock).mockResolvedValue(true);
            const input = { profile: { displayName: 'A' } };

            await expect(R.Mutation.solidPushPortableState(undefined, { input }, ctxA())).resolves.toBe(true);
            expect(pushPortableState).toHaveBeenCalledWith(USER_A, CLIENT_ID, input, store.prisma);
        });

        it('parses a JSON string payload for activity events', async () => {
            (appendActivityEvent as jest.Mock).mockResolvedValue(true);

            await R.Mutation.solidAppendActivityEvent(
                undefined,
                { input: { type: 'PostCreated', instanceId: 'i', resourceUrl: 'u', payload: '{"postId":"1"}' } },
                ctxA()
            );

            expect(appendActivityEvent).toHaveBeenCalledWith(
                USER_A,
                CLIENT_ID,
                expect.objectContaining({ payload: { postId: '1' } }),
                store.prisma
            );
        });

        it('rejects a non-object activity payload as BAD_USER_INPUT', async () => {
            const error = await captureError(
                R.Mutation.solidAppendActivityEvent(
                    undefined,
                    { input: { type: 'PostCreated', instanceId: 'i', resourceUrl: 'u', payload: '[1]' } },
                    ctxA()
                )
            );
            expect(codeOf(error)).toBe('BAD_USER_INPUT');
        });

        it('maps an invalid_grant during pull to SOLID_REAUTH_REQUIRED', async () => {
            (pullPortableState as jest.Mock).mockRejectedValue(
                new SolidOidcError('invalid_grant', 'Authorization grant was rejected', 400)
            );

            const error = await captureError(R.Query.solidPullPortableState(undefined, {}, ctxA()));

            expect(codeOf(error)).toBe('SOLID_REAUTH_REQUIRED');
        });

        it('maps a Pod 401 to SOLID_REAUTH_REQUIRED', async () => {
            (pushPortableState as jest.Mock).mockRejectedValue(
                new SolidPodError('http', 'Pod request failed with HTTP 401', 401)
            );

            const error = await captureError(
                R.Mutation.solidPushPortableState(undefined, { input: { profile: { displayName: 'x' } } }, ctxA())
            );

            expect(codeOf(error)).toBe('SOLID_REAUTH_REQUIRED');
        });

        it('maps a Pod timeout to SOLID_UNAVAILABLE with a generic message', async () => {
            (pullPortableState as jest.Mock).mockRejectedValue(new SolidPodError('timeout', 'Pod request timed out'));

            const error = await captureError(R.Query.solidPullPortableState(undefined, {}, ctxA()));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(error.message).not.toMatch(/timed out|Pod request/);
        });

        it('maps unexpected failures to SOLID_UNAVAILABLE without forwarding their message', async () => {
            (pullPortableState as jest.Mock).mockRejectedValue(new Error('boom TOKEN-XYZ'));

            const error = await captureError(R.Query.solidPullPortableState(undefined, {}, ctxA()));

            expect(codeOf(error)).toBe('SOLID_UNAVAILABLE');
            expect(error.message).not.toMatch(/TOKEN-XYZ/);
        });

        it('maps a missing connection to BAD_USER_INPUT', async () => {
            (pullPortableState as jest.Mock).mockRejectedValue(new SolidNotConnectedError());

            const error = await captureError(R.Query.solidPullPortableState(undefined, {}, ctxA()));

            expect(codeOf(error)).toBe('BAD_USER_INPUT');
        });

        it('keeps other resolvers working after a Pod failure', async () => {
            store.connections.set(USER_A, { userId: USER_A, webId: WEBID_A, issuer: ISSUER });
            (pullPortableState as jest.Mock).mockRejectedValue(new SolidPodError('network', 'Pod request failed'));

            await captureError(R.Query.solidPullPortableState(undefined, {}, ctxA()));
            const status = await R.Query.solidConnectionStatus(undefined, {}, ctxA());

            expect(status).toMatchObject({ connected: true, webId: WEBID_A });
        });
    });

    describe('authentication', () => {
        it.each([
            ['solidConnectionStatus', () => R.Query.solidConnectionStatus(undefined, {}, makeContext(store.prisma, null))],
            ['solidDisconnect', () => R.Mutation.solidDisconnect(undefined, {}, makeContext(store.prisma, null))],
            ['solidPullPortableState', () => R.Query.solidPullPortableState(undefined, {}, makeContext(store.prisma, null))],
            [
                'solidPushPortableState',
                () => R.Mutation.solidPushPortableState(undefined, { input: {} }, makeContext(store.prisma, null)),
            ],
        ])('%s requires authentication', async (_name, call) => {
            const error = await captureError(call());
            expect(codeOf(error)).toBe('UNAUTHENTICATED');
        });
    });
});

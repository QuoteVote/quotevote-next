import { graphql, parse, validate, type GraphQLObjectType } from 'graphql';
import type { PrismaClient } from '@prisma/client';
import { schema } from '~/data/schema';
import { pullPortableState, pushPortableState } from '~/solid/sync/syncService';
import type { PortableState } from '~/solid/schemas/portable';

/**
 * Runs the Solid documents against the real executable schema (all type definitions and
 * resolvers wired), with a Prisma stub and a mocked Pod sync layer.
 */

jest.mock('~/data/utils/logger', () => ({
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('~/solid/sync/syncService', () => ({
    pullPortableState: jest.fn(),
    pushPortableState: jest.fn(),
    appendActivityEvent: jest.fn(),
}));

const USER_ID = '507f1f77bcf86cd799439011';

const PORTABLE: PortableState = {
    portableSchemaVersion: '0',
    profile: { displayName: 'Ana', avatarUrl: null, bio: null },
    preferences: {
        theme: 'dark',
        notifications: { email: true, push: false, inApp: true },
        accessibility: { reduceMotion: false, fontScale: 'large' },
    },
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const DOCUMENTS = {
    connectionStatus: 'query { solidConnectionStatus { connected webId issuer lastSyncAt } }',
    startConnect: 'mutation { solidStartConnect(issuer: "https://issuer.example") { authorizationUrl } }',
    finishConnect:
        'mutation { solidFinishConnect(code: "c", state: "s", redirectUri: "https://app/cb") { success webId issuer message } }',
    pull:
        'query { solidPullPortableState { portableSchemaVersion profile { displayName } ' +
        'preferences { theme notifications { email } accessibility { fontScale } } updatedAt } }',
    push: 'mutation { solidPushPortableState(input: {profile: {displayName: "x"}, preferences: {theme: "dark"}}) }',
    disconnect: 'mutation { solidDisconnect }',
    appendEvent:
        'mutation { solidAppendActivityEvent(input: {type: "PostCreated", instanceId: "i", resourceUrl: "u", payload: "{}"}) }',
} as const;

function makePrisma(connection: Record<string, unknown> | null = null) {
    return {
        solidConnection: {
            findUnique: jest.fn().mockResolvedValue(connection),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        solidAuthState: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
    };
}

async function run(source: string, prisma: unknown, userId: string | null = USER_ID) {
    return graphql({
        schema,
        source,
        contextValue: { prisma: prisma as PrismaClient, userId, user: null, req: {}, res: {}, pubsub: {}, requestId: 't' },
    });
}

describe('Solid GraphQL documents against the real schema', () => {
    beforeAll(() => {
        process.env.SOLID_CLIENT_ID = 'https://app.example/solid/client-id.json';
        process.env.SOLID_TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(Object.entries(DOCUMENTS))('%s validates against the schema', (_name, source) => {
        expect(validate(schema, parse(source))).toEqual([]);
    });

    it('defines each Solid type exactly once, with the portable contract shape', () => {
        const portable = schema.getType('PortableState') as GraphQLObjectType;
        expect(Object.keys(portable.getFields()).sort()).toEqual(
            ['portableSchemaVersion', 'preferences', 'profile', 'updatedAt'].sort()
        );
        expect(schema.getType('PortableStateInput')).toBeDefined();
        expect(schema.getType('SolidConnectResult')).toBeUndefined();
    });

    it('exposes solidPullPortableState as a Query only', () => {
        expect(schema.getQueryType()?.getFields().solidPullPortableState).toBeDefined();
        expect(schema.getMutationType()?.getFields().solidPullPortableState).toBeUndefined();
    });

    it('solidConnectionStatus reports disconnected when there is no connection', async () => {
        const result = await run(DOCUMENTS.connectionStatus, makePrisma(null));

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            solidConnectionStatus: { connected: false, webId: null, issuer: null, lastSyncAt: null },
        });
    });

    it('solidConnectionStatus reports the caller connection', async () => {
        const prisma = makePrisma({
            webId: 'https://pod.example/profile/card#me',
            issuer: 'https://issuer.example',
            lastSyncAt: new Date('2026-01-02T03:04:05.000Z'),
        });

        const result = await run(DOCUMENTS.connectionStatus, prisma);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            solidConnectionStatus: {
                connected: true,
                webId: 'https://pod.example/profile/card#me',
                issuer: 'https://issuer.example',
                lastSyncAt: '2026-01-02T03:04:05.000Z',
            },
        });
    });

    it('solidStartConnect returns a BAD_USER_INPUT error for an http issuer', async () => {
        const result = await run(
            'mutation { solidStartConnect(issuer: "http://example.com") { authorizationUrl } }',
            makePrisma()
        );

        expect(result.data).toBeNull();
        expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    });

    it('solidPullPortableState is a Query returning the requested portable fields', async () => {
        (pullPortableState as jest.Mock).mockResolvedValue(PORTABLE);

        const result = await run(
            `query {
                solidPullPortableState {
                    profile { displayName }
                    preferences { theme notifications { email } accessibility { fontScale } }
                }
            }`,
            makePrisma()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            solidPullPortableState: {
                profile: { displayName: 'Ana' },
                preferences: {
                    theme: 'dark',
                    notifications: { email: true },
                    accessibility: { fontScale: 'large' },
                },
            },
        });
    });

    it('solidPushPortableState accepts a nested partial input', async () => {
        (pushPortableState as jest.Mock).mockResolvedValue(true);

        const result = await run(
            'mutation { solidPushPortableState(input: {profile: {displayName: "x"}, preferences: {theme: "dark"}}) }',
            makePrisma(
                { webId: 'https://pod.example/profile/card#me', issuer: 'https://issuer.example' }
            )
        );

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({ solidPushPortableState: true });
        expect(pushPortableState).toHaveBeenCalledWith(
            USER_ID,
            'https://app.example/solid/client-id.json',
            { profile: { displayName: 'x' }, preferences: { theme: 'dark' } },
            expect.anything()
        );
    });

    it('solidDisconnect returns true and removes only the caller rows', async () => {
        const prisma = makePrisma();

        const result = await run(DOCUMENTS.disconnect, prisma);

        expect(result).toEqual({ data: { solidDisconnect: true } });
        expect(prisma.solidConnection.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
        expect(prisma.solidAuthState.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    });

    it('requires authentication for the Solid queries', async () => {
        const result = await run(DOCUMENTS.connectionStatus, makePrisma(), null);

        expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });
});

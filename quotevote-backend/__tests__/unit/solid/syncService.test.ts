import type { PrismaClient } from '@prisma/client';
import {
    pullPortableState,
    pushPortableState,
    appendActivityEvent,
} from '../../../app/solid/sync/syncService';
import { SolidClient } from '../../../app/solid/client/solidClient';
import * as portableSchemas from '../../../app/solid/schemas/portable';
import {
    SolidFeatureDisabledError,
    SolidInvalidInputError,
    SolidNotConnectedError,
    SolidPodError,
} from '../../../app/solid/errors';

jest.mock('../../../app/solid/client/solidClient');

describe('SyncService (Prisma)', () => {
    const userId = '507f1f77bcf86cd799439011';
    const clientId = 'client123';
    const uris = {
        profile: 'https://pod.example/public/quote-vote/profile',
        preferences: 'https://pod.example/private/quote-vote/preferences',
        activityLedger: 'https://pod.example/private/quote-vote/activity-ledger',
    };

    let prisma: {
        solidConnection: {
            findUnique: jest.Mock;
            update: jest.Mock;
            updateMany: jest.Mock;
        };
    };
    let getJson: jest.Mock;
    let putJson: jest.Mock;

    const asPrisma = (): PrismaClient => prisma as unknown as PrismaClient;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SOLID_ACTIVITY_LEDGER_ENABLED = 'true';

        prisma = {
            solidConnection: {
                findUnique: jest.fn().mockResolvedValue({
                    userId,
                    webId: 'https://pod.example/profile/card#me',
                    resourceUris: uris,
                }),
                update: jest.fn().mockResolvedValue({}),
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
        };

        getJson = jest.fn();
        putJson = jest.fn().mockResolvedValue(undefined);
        (SolidClient as unknown as jest.Mock).mockImplementation(() => ({ getJson, putJson }));
    });

    const notFound = () => new SolidPodError('http', 'Pod request failed with HTTP 404', 404);
    const timeout = () => new SolidPodError('timeout', 'Pod request timed out');

    describe('pullPortableState', () => {
        it('returns Pod values without writing anything locally', async () => {
            const profile = { displayName: 'John Doe', avatarUrl: null, bio: 'Hello' };
            const preferences = { theme: 'dark', notifications: {}, accessibility: {} };
            getJson
                .mockResolvedValueOnce(profile)
                .mockResolvedValueOnce(preferences)
                .mockResolvedValueOnce({ events: [] });

            const state = await pullPortableState(userId, clientId, asPrisma());

            expect(state.profile).toEqual(profile);
            expect(state.preferences).toEqual(preferences);
            expect(state.portableSchemaVersion).toBe(portableSchemas.PORTABLE_SCHEMA_VERSION);
            expect(getJson).toHaveBeenCalledTimes(3);
            expect(prisma.solidConnection.update).not.toHaveBeenCalled();
            expect(putJson).not.toHaveBeenCalled();
        });

        it('falls back to defaults only when the Pod resource does not exist (404)', async () => {
            getJson.mockRejectedValue(notFound());

            const state = await pullPortableState(userId, clientId, asPrisma());

            expect(state.profile).toEqual(portableSchemas.createDefaultProfile());
            expect(state.preferences).toEqual(portableSchemas.createDefaultPreferences());
        });

        it('propagates transient Pod failures instead of substituting defaults', async () => {
            getJson.mockRejectedValue(timeout());

            await expect(pullPortableState(userId, clientId, asPrisma())).rejects.toBeInstanceOf(
                SolidPodError
            );
        });

        it('throws SolidNotConnectedError when no connection exists', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue(null);

            await expect(pullPortableState(userId, clientId, asPrisma())).rejects.toBeInstanceOf(
                SolidNotConnectedError
            );
        });

        it('derives and stores default Pod URIs from the WebID when none are stored', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                userId,
                webId: 'https://pod.example/profile/card#me',
                resourceUris: null,
            });
            getJson.mockRejectedValue(notFound());

            await pullPortableState(userId, clientId, asPrisma());

            expect(prisma.solidConnection.update).toHaveBeenCalledWith({
                where: { userId },
                data: {
                    resourceUris: {
                        profile: 'https://pod.example/public/quote-vote/profile',
                        preferences: 'https://pod.example/private/quote-vote/preferences',
                        activityLedger: 'https://pod.example/private/quote-vote/activity-ledger',
                    },
                },
            });
        });
    });

    describe('pushPortableState', () => {
        it('merges member-supplied profile fields over Pod values and preserves the rest', async () => {
            getJson.mockResolvedValueOnce({ displayName: 'Old', avatarUrl: 'https://a.example/x.png', bio: 'keep me' });

            const result = await pushPortableState(
                userId,
                clientId,
                { profile: { displayName: 'New', bio: undefined } },
                asPrisma()
            );

            expect(result).toBe(true);
            expect(putJson).toHaveBeenCalledWith(uris.profile, {
                displayName: 'New',
                avatarUrl: 'https://a.example/x.png',
                bio: 'keep me',
            });
            expect(prisma.solidConnection.updateMany).toHaveBeenCalledWith({
                where: { userId },
                data: { lastSyncAt: expect.any(Date) },
            });
        });

        it('merges nested preferences and keeps untouched Pod preferences', async () => {
            getJson.mockResolvedValueOnce({
                theme: 'light',
                notifications: { email: true, push: false, inApp: true },
                accessibility: { reduceMotion: true, fontScale: 'normal' },
            });

            await pushPortableState(
                userId,
                clientId,
                { preferences: { theme: 'dark', notifications: { push: true } } },
                asPrisma()
            );

            expect(putJson).toHaveBeenCalledWith(uris.preferences, {
                theme: 'dark',
                notifications: { email: true, push: true, inApp: true },
                accessibility: { reduceMotion: true, fontScale: 'normal' },
            });
        });

        it('rejects unknown theme values before contacting the Pod', async () => {
            await expect(
                pushPortableState(userId, clientId, { preferences: { theme: 'neon' as never } }, asPrisma())
            ).rejects.toBeInstanceOf(SolidInvalidInputError);
            expect(putJson).not.toHaveBeenCalled();
        });

        it('never overwrites Pod data with defaults when the read fails transiently', async () => {
            getJson.mockRejectedValue(timeout());

            await expect(
                pushPortableState(userId, clientId, { profile: { displayName: 'X' } }, asPrisma())
            ).rejects.toBeInstanceOf(SolidPodError);
            expect(putJson).not.toHaveBeenCalled();
        });

        it('writes defaults only when the profile does not exist yet (404)', async () => {
            getJson.mockRejectedValue(notFound());

            await pushPortableState(userId, clientId, { profile: { bio: 'hi' } }, asPrisma());

            expect(putJson).toHaveBeenCalledWith(uris.profile, {
                ...portableSchemas.createDefaultProfile(),
                bio: 'hi',
            });
        });
    });

    describe('appendActivityEvent', () => {
        const event = {
            type: 'PostCreated' as const,
            instanceId: 'instance-1',
            resourceUrl: 'https://quote.vote/post/1',
            payload: { postId: '1', content: 'hello' },
        };

        it('appends the event to the existing ledger', async () => {
            getJson.mockResolvedValue({ events: [{ type: 'VoteCast' }] });

            const result = await appendActivityEvent(userId, clientId, event, asPrisma());

            expect(result).toBe(true);
            const written = putJson.mock.calls[0][1] as { events: Array<Record<string, unknown>> };
            expect(written.events).toHaveLength(2);
            expect(written.events[1]).toMatchObject({
                type: 'PostCreated',
                instanceId: 'instance-1',
                resourceUrl: 'https://quote.vote/post/1',
                payload: { postId: '1', content: 'hello' },
            });
        });

        it('does not overwrite a ledger it cannot interpret', async () => {
            getJson.mockResolvedValue({ events: 'corrupt' });

            await expect(appendActivityEvent(userId, clientId, event, asPrisma())).rejects.toThrow(
                'Activity ledger has an unexpected format'
            );
            expect(putJson).not.toHaveBeenCalled();
        });

        it('throws SolidFeatureDisabledError when the ledger is disabled', async () => {
            process.env.SOLID_ACTIVITY_LEDGER_ENABLED = 'false';

            await expect(appendActivityEvent(userId, clientId, event, asPrisma())).rejects.toBeInstanceOf(
                SolidFeatureDisabledError
            );
            expect(getJson).not.toHaveBeenCalled();
        });
    });
});

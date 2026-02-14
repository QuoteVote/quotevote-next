import { pullPortableState, pushPortableState, appendActivityEvent } from '../../../app/solid/sync/syncService';
import { SolidClient } from '../../../app/solid/client/solidClient';
import { SolidConnection } from '../../../app/data/models/SolidConnection';
import * as portableSchemas from '../../../app/solid/schemas/portable';

// Mock dependencies
jest.mock('../../../app/solid/client/solidClient');
jest.mock('../../../app/data/models/SolidConnection');

describe('SyncService', () => {
    const mockUserId = 'user123';
    const mockClientId = 'client123';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SOLID_ACTIVITY_LEDGER_ENABLED = 'true';
    });

    describe('pullPortableState', () => {
        it('should pull portable state successfully', async () => {
            const mockProfile = { displayName: 'John Doe', avatarUrl: null, bio: 'Hello' };
            const mockPreferences = { theme: 'dark', notifications: {}, accessibility: {} };
            
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                userId: mockUserId,
                webId: 'https://pod.example/webId',
                resourceUris: {
                    profile: 'https://pod.example/profile',
                    preferences: 'https://pod.example/preferences',
                    activityLedger: 'https://pod.example/ledger'
                },
                save: jest.fn().mockResolvedValue(true)
            });

            const mockGetJson = jest.fn();
            (SolidClient as jest.Mock).mockImplementation(() => ({
                getJson: mockGetJson
            }));

            mockGetJson.mockResolvedValueOnce(mockProfile);
            mockGetJson.mockResolvedValueOnce(mockPreferences);
            mockGetJson.mockResolvedValueOnce({ events: [] });

            const state = await pullPortableState(mockUserId, mockClientId);

            expect(state.profile).toEqual(mockProfile);
            expect(state.preferences).toEqual(mockPreferences);
            expect(mockGetJson).toHaveBeenCalledTimes(3);
        });

        it('should use default profile/preferences if fetch fails', async () => {
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                webId: 'https://pod.example/webId',
                save: jest.fn().mockResolvedValue(true)
            });
            (SolidConnection.prototype.save as jest.Mock) = jest.fn().mockResolvedValue(true);

            const mockGetJson = jest.fn().mockRejectedValue(new Error('Not found'));
            (SolidClient as jest.Mock).mockImplementation(() => ({
                getJson: mockGetJson
            }));

            const state = await pullPortableState(mockUserId, mockClientId);

            expect(state.profile).toEqual(portableSchemas.createDefaultProfile());
            expect(state.preferences).toEqual(portableSchemas.createDefaultPreferences());
        });
    });

    describe('pushPortableState', () => {
        it('should push profile and preferences successfully', async () => {
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                webId: 'https://pod.example/webId',
                resourceUris: { profile: 'p', preferences: 'pref' },
                save: jest.fn().mockResolvedValue(true)
            });

            const mockGetJson = jest.fn().mockResolvedValue({});
            const mockPutJson = jest.fn().mockResolvedValue(undefined);
            (SolidClient as jest.Mock).mockImplementation(() => ({
                getJson: mockGetJson,
                putJson: mockPutJson
            }));

            const input = {
                profile: { displayName: 'New Name' },
                preferences: { theme: 'light' as const }
            };

            const result = await pushPortableState(mockUserId, mockClientId, input);

            expect(result).toBe(true);
            expect(mockPutJson).toHaveBeenCalledTimes(2);
            expect(SolidConnection.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: mockUserId },
                expect.objectContaining({ lastSyncAt: expect.any(Date) })
            );
        });
    });

    describe('appendActivityEvent', () => {
        it('should append event to ledger', async () => {
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                webId: 'https://pod.example/webId',
                resourceUris: { 
                    profile: 'profile',
                    preferences: 'prefs',
                    activityLedger: 'ledger' 
                },
                save: jest.fn().mockResolvedValue(true)
            });

            const mockGetJson = jest.fn().mockResolvedValue({ events: [] });
            const mockPutJson = jest.fn().mockResolvedValue(undefined);
            (SolidClient as jest.Mock).mockImplementation(() => ({
                getJson: mockGetJson,
                putJson: mockPutJson
            }));

            const eventInput = {
                type: 'PostCreated' as const,
                instanceId: 'inst1',
                resourceUrl: 'res1',
                payload: { postId: '123' }
            };

            const result = await appendActivityEvent(mockUserId, mockClientId, eventInput);

            expect(result).toBe(true);
            expect(mockPutJson).toHaveBeenCalledWith('ledger', expect.objectContaining({
                events: expect.arrayContaining([expect.objectContaining({ type: 'PostCreated' })])
            }));
        });

        it('should throw error if ledger is disabled', async () => {
            process.env.SOLID_ACTIVITY_LEDGER_ENABLED = 'false';
            await expect(appendActivityEvent(mockUserId, mockClientId, {} as portableSchemas.ActivityEventInput))
                .rejects.toThrow('Activity ledger is not enabled');
        });
    });
});

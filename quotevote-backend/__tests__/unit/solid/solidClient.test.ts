import { SolidClient } from '../../../app/solid/client/solidClient';
import { SolidConnection } from '../../../app/data/models/SolidConnection';
import { decryptTokens, encryptTokens } from '../../../app/solid/storage/encryption';
import { refreshAccessToken } from '../../../app/solid/oidc/authorization';

// Mock dependencies
jest.mock('../../../app/data/models/SolidConnection');
jest.mock('../../../app/solid/storage/encryption');
jest.mock('../../../app/solid/oidc/authorization');

describe('SolidClient', () => {
    const mockConfig = {
        userId: 'user123',
        clientId: 'client123',
    };

    let client: SolidClient;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new SolidClient(mockConfig);
        
        // Default global fetch mock
        global.fetch = jest.fn();
    });

    describe('fetch', () => {
        it('should perform an authenticated fetch with a valid token', async () => {
            const mockUrl = 'https://pod.example/resource';
            const mockToken = 'access-token-123';
            const mockExpiry = new Date(Date.now() + 3600 * 1000);

            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                encryptedTokens: 'encrypted-stuff',
                tokenExpiry: mockExpiry,
            });

            (decryptTokens as jest.Mock).mockReturnValue({
                access_token: mockToken,
            });

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
            });

            const response = await client.fetch(mockUrl);

            expect(response.status).toBe(200);
            expect(global.fetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
                headers: expect.any(Headers),
            }));
            
            const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
            expect(callHeaders.get('Authorization')).toBe(`Bearer ${mockToken}`);
        });

        it('should refresh token and retry if fetch returns 401', async () => {
            const mockUrl = 'https://pod.example/resource';
            const mockOldToken = 'old-token';
            const mockNewToken = 'new-token';
            const mockRefreshToken = 'refresh-token';

            const mockConnection = {
                userId: mockConfig.userId,
                issuer: 'https://issuer.example',
                encryptedTokens: 'encrypted-old',
                tokenExpiry: new Date(Date.now() + 3600 * 1000),
                save: jest.fn().mockResolvedValue(true),
            };

            (SolidConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);
            
            (decryptTokens as jest.Mock)
                .mockReturnValueOnce({ access_token: mockOldToken, refresh_token: mockRefreshToken })
                .mockReturnValueOnce({ access_token: mockOldToken, refresh_token: mockRefreshToken })
                .mockReturnValue({ access_token: mockOldToken, refresh_token: mockRefreshToken });

            (refreshAccessToken as jest.Mock).mockResolvedValue({
                access_token: mockNewToken,
                refresh_token: mockRefreshToken,
                expires_in: 3600,
            });

            (encryptTokens as jest.Mock).mockReturnValue('encrypted-new');

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ status: 401, ok: false })
                .mockResolvedValueOnce({ status: 200, ok: true });

            const response = await client.fetch(mockUrl);

            expect(response.status).toBe(200);
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken, mockConnection.issuer, mockConfig.clientId);
            expect(mockConnection.save).toHaveBeenCalled();
        });

        it('should throw error if no valid access token is available', async () => {
            (SolidConnection.findOne as jest.Mock).mockResolvedValue(null);

            await expect(client.fetch('https://pod.example')).rejects.toThrow('No Solid connection found for user');
        });
    });

    describe('getJson', () => {
        it('should return parsed JSON from response', async () => {
            const mockData = { key: 'value' };
            
            // Mock ensureValidToken success
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                encryptedTokens: 'enc',
                tokenExpiry: new Date(Date.now() + 3600 * 1000),
            });
            (decryptTokens as jest.Mock).mockReturnValue({ access_token: 'token' });

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockData),
            });

            const result = await client.getJson( 'https://pod.example/data.json');
            expect(result).toEqual(mockData);
        });

        it('should throw error if response is not ok', async () => {
            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                encryptedTokens: 'enc',
                tokenExpiry: new Date(Date.now() + 3600 * 1000),
            });
            (decryptTokens as jest.Mock).mockReturnValue({ access_token: 'token' });

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            await expect(client.getJson('https://pod.example/missing')).rejects.toThrow('Failed to fetch resource: 404 Not Found');
        });
    });

    describe('putJson', () => {
        it('should perform PUT request with JSON body', async () => {
            const mockData = { key: 'value' };

            (SolidConnection.findOne as jest.Mock).mockResolvedValue({
                encryptedTokens: 'enc',
                tokenExpiry: new Date(Date.now() + 3600 * 1000),
            });
            (decryptTokens as jest.Mock).mockReturnValue({ access_token: 'token' });

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 204,
            });

            await client.putJson('https://pod.example/update', mockData);

            expect(global.fetch).toHaveBeenCalledWith('https://pod.example/update', expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify(mockData),
            }));
        });
    });
});

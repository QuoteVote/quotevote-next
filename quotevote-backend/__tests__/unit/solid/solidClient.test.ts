import type { PrismaClient } from '@prisma/client';
import { SolidClient } from '../../../app/solid/client/solidClient';
import { decryptTokens, encryptTokens } from '../../../app/solid/storage/encryption';
import { refreshAccessToken } from '../../../app/solid/oidc/authorization';
import {
    SolidNotConnectedError,
    SolidOidcError,
    SolidPodError,
} from '../../../app/solid/errors';

jest.mock('../../../app/solid/storage/encryption');
jest.mock('../../../app/solid/oidc/authorization');

const mockDecrypt = decryptTokens as jest.MockedFunction<typeof decryptTokens>;
const mockEncrypt = encryptTokens as jest.MockedFunction<typeof encryptTokens>;
const mockRefresh = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;

describe('SolidClient', () => {
    const userId = 'user123';
    const clientId = 'client123';
    const future = () => new Date(Date.now() + 3600 * 1000);

    let prisma: {
        solidConnection: {
            findUnique: jest.Mock;
            update: jest.Mock;
        };
    };

    const makeClient = (): SolidClient =>
        new SolidClient({ userId, clientId, prisma: prisma as unknown as PrismaClient });

    beforeEach(() => {
        jest.clearAllMocks();
        prisma = {
            solidConnection: {
                findUnique: jest.fn(),
                update: jest.fn().mockResolvedValue({}),
            },
        };
        global.fetch = jest.fn();
    });

    describe('fetch', () => {
        it('performs an authenticated fetch with a valid token', async () => {
            const url = 'https://pod.example/resource';
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'access-token-123' });
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

            const response = await makeClient().fetch(url);

            expect(response.status).toBe(200);
            expect(prisma.solidConnection.findUnique).toHaveBeenCalledWith({
                where: { userId },
            });
            const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer access-token-123');
        });

        it('refreshes the token once on 401, retries, and persists merged tokens', async () => {
            const url = 'https://pod.example/resource';
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc-old',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({
                access_token: 'old-token',
                refresh_token: 'refresh-token',
                id_token: 'id-token',
            });
            mockRefresh.mockResolvedValue({
                access_token: 'new-token',
                token_type: 'Bearer',
                expires_in: 3600,
            });
            mockEncrypt.mockReturnValue('enc-new');
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ status: 401, ok: false })
                .mockResolvedValueOnce({ status: 200, ok: true });

            const response = await makeClient().fetch(url);

            expect(response.status).toBe(200);
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(mockRefresh).toHaveBeenCalledWith('refresh-token', 'https://issuer.example', clientId);

            const secondHeaders = (global.fetch as jest.Mock).mock.calls[1][1].headers as Headers;
            expect(secondHeaders.get('Authorization')).toBe('Bearer new-token');

            // Refresh token and id token are preserved when the provider omits them.
            expect(mockEncrypt).toHaveBeenCalledWith({
                access_token: 'new-token',
                refresh_token: 'refresh-token',
                id_token: 'id-token',
            });
            expect(prisma.solidConnection.update).toHaveBeenCalledWith({
                where: { userId },
                data: { encryptedTokens: 'enc-new', tokenExpiry: expect.any(Date) },
            });
        });

        it('refreshes proactively when the token expires within 5 minutes', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: new Date(Date.now() + 60 * 1000),
            });
            mockDecrypt.mockReturnValue({ access_token: 'soon-expiring', refresh_token: 'rt' });
            mockRefresh.mockResolvedValue({ access_token: 'fresh', token_type: 'Bearer' });
            mockEncrypt.mockReturnValue('enc-fresh');
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

            await makeClient().fetch('https://pod.example/x');

            expect(mockRefresh).toHaveBeenCalledTimes(1);
            const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer fresh');
        });

        it('throws SolidNotConnectedError when the user has no connection', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue(null);

            await expect(makeClient().fetch('https://pod.example')).rejects.toBeInstanceOf(
                SolidNotConnectedError
            );
        });

        it('surfaces an invalid_grant refresh failure as SolidOidcError without leaking tokens', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'ACCESS-SECRET', refresh_token: 'REFRESH-SECRET' });
            mockRefresh.mockRejectedValue(new SolidOidcError('invalid_grant', 'Authorization grant was rejected', 400));
            (global.fetch as jest.Mock).mockResolvedValue({ status: 401, ok: false });

            const error = await makeClient().fetch('https://pod.example').catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SolidOidcError);
            expect((error as SolidOidcError).code).toBe('invalid_grant');
            expect((error as Error).message).not.toMatch(/SECRET/);
            expect(prisma.solidConnection.update).not.toHaveBeenCalled();
        });

        it('maps a Pod timeout to SolidPodError with kind "timeout"', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'token' });
            const timeout = new Error('The operation was aborted due to timeout');
            timeout.name = 'TimeoutError';
            (global.fetch as jest.Mock).mockRejectedValue(timeout);

            const error = await makeClient().fetch('https://pod.example/slow').catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SolidPodError);
            expect((error as SolidPodError).kind).toBe('timeout');
            expect((error as Error).message).not.toMatch(/pod\.example/);
        });
    });

    describe('getJson', () => {
        it('returns parsed JSON from the response', async () => {
            const mockData = { key: 'value' };
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'token' });
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockData),
            });

            await expect(makeClient().getJson('https://pod.example/x')).resolves.toEqual(mockData);
        });

        it('throws SolidPodError with the HTTP status for non-2xx responses', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'token' });
            (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

            const error = await makeClient().getJson('https://pod.example/missing').catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SolidPodError);
            expect((error as SolidPodError).status).toBe(404);
        });
    });

    describe('putJson', () => {
        it('performs a PUT request with a JSON body', async () => {
            prisma.solidConnection.findUnique.mockResolvedValue({
                issuer: 'https://issuer.example',
                encryptedTokens: 'enc',
                tokenExpiry: future(),
            });
            mockDecrypt.mockReturnValue({ access_token: 'token' });
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 201 });

            await makeClient().putJson('https://pod.example/x', { a: 1 });

            const init = (global.fetch as jest.Mock).mock.calls[0][1];
            expect(init.method).toBe('PUT');
            expect(init.body).toBe(JSON.stringify({ a: 1 }));
        });
    });
});

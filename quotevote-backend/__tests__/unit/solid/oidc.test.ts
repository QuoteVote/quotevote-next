import { validateIssuerUrl } from '../../../app/solid/oidc/discovery';
import {
    exchangeCodeForTokens,
    refreshAccessToken,
} from '../../../app/solid/oidc/authorization';
import { SolidOidcError } from '../../../app/solid/errors';
import { generateDpopKeyPair } from '../../../app/solid/oidc/dpop';

jest.mock('../../../app/solid/oidc/discovery', () => ({
    ...jest.requireActual('../../../app/solid/oidc/discovery'),
    discoverIssuer: jest.fn().mockResolvedValue({
        issuer: 'https://issuer.example',
        authorization_endpoint: 'https://issuer.example/authorize',
        token_endpoint: 'https://issuer.example/token',
        jwks_uri: 'https://issuer.example/jwks',
    }),
}));

describe('Solid OIDC - Discovery and Authorization', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    describe('validateIssuerUrl', () => {
        it('should validate HTTPS URLs', () => {
            expect(validateIssuerUrl('https://solidcommunity.net')).toBe(true);
            expect(validateIssuerUrl('https://example.com')).toBe(true);
        });

        it('should allow HTTP for localhost and 127.0.0.1 outside production', () => {
            expect(validateIssuerUrl('http://localhost:3000')).toBe(true);
            expect(validateIssuerUrl('http://localhost')).toBe(true);
            expect(validateIssuerUrl('http://127.0.0.1:4000')).toBe(true);
        });

        it('should reject HTTP for localhost in production', () => {
            process.env.NODE_ENV = 'production';
            expect(validateIssuerUrl('http://localhost:3000')).toBe(false);
            expect(validateIssuerUrl('https://example.com')).toBe(true);
        });

        it('should reject HTTP for non-localhost', () => {
            expect(validateIssuerUrl('http://example.com')).toBe(false);
        });

        it('should reject invalid URLs', () => {
            expect(validateIssuerUrl('not-a-url')).toBe(false);
            expect(validateIssuerUrl('')).toBe(false);
            expect(validateIssuerUrl('ftp://example.com')).toBe(false);
        });

        it('should reject issuers with credentials or fragments', () => {
            expect(validateIssuerUrl('https://user:pass@example.com')).toBe(false);
            expect(validateIssuerUrl('https://example.com/#frag')).toBe(false);
        });
    });

    describe('token endpoint errors', () => {
        const fetchMock = jest.fn();

        beforeEach(() => {
            fetchMock.mockReset();
            global.fetch = fetchMock as unknown as typeof fetch;
        });

        const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
            ({
                ok: status >= 200 && status < 300,
                status,
                statusText: 'x',
                headers: new Headers(headers),
                json: async () => body,
                text: async () => JSON.stringify(body),
            }) as unknown as Response;

        it('maps invalid_grant on refresh to SolidOidcError(invalid_grant) without the provider body', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse(400, { error: 'invalid_grant', error_description: 'REFRESH-TOKEN-VALUE-LEAK' })
            );

            const error = await refreshAccessToken('REFRESH-TOKEN-VALUE', 'https://issuer.example', 'cid')
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SolidOidcError);
            expect((error as SolidOidcError).code).toBe('invalid_grant');
            expect((error as SolidOidcError).status).toBe(400);
            expect((error as Error).message).not.toMatch(/LEAK|REFRESH-TOKEN/);
        });

        it('does not include a non-OAuth provider body in the error on 5xx', async () => {
            fetchMock.mockResolvedValue(jsonResponse(500, { access_token: 'ACCESS-LEAK', detail: 'CODE-LEAK' }));

            const error = await exchangeCodeForTokens(
                'AUTH-CODE', 'VERIFIER', 'https://app/cb', 'https://issuer.example', 'cid'
            ).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SolidOidcError);
            expect((error as SolidOidcError).code).toBe('provider_error');
            expect((error as SolidOidcError).status).toBe(500);
            expect((error as Error).message).not.toMatch(/LEAK|ACCESS|AUTH-CODE|VERIFIER/);
        });

        it('maps network failures to provider_error with a generic message', async () => {
            fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:443 with token=abc'));

            const error = await refreshAccessToken('rt', 'https://issuer.example', 'cid').catch((e: unknown) => e);

            expect((error as SolidOidcError).code).toBe('provider_error');
            expect((error as Error).message).not.toMatch(/10\.0\.0\.5|token=/);
        });

        it('rejects a 2xx response without access_token as invalid_response', async () => {
            fetchMock.mockResolvedValue(jsonResponse(200, { token_type: 'Bearer' }));

            const error = await refreshAccessToken('rt', 'https://issuer.example', 'cid').catch((e: unknown) => e);

            expect((error as SolidOidcError).code).toBe('invalid_response');
        });

        it('returns tokens on success', async () => {
            fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'a', token_type: 'Bearer', expires_in: 60 }));

            await expect(
                exchangeCodeForTokens('c', 'v', 'https://app/cb', 'https://issuer.example', 'cid')
            ).resolves.toMatchObject({ access_token: 'a', expires_in: 60 });
        });

        it('never follows redirects on token requests', async () => {
            fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'a', token_type: 'Bearer' }));

            await refreshAccessToken('rt', 'https://issuer.example', 'cid');

            expect(fetchMock.mock.calls[0][1].redirect).toBe('error');
        });

        it('sends a DPoP proof for the token endpoint when a key pair is supplied', async () => {
            const keys = generateDpopKeyPair();
            fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'a', token_type: 'DPoP' }));

            await exchangeCodeForTokens('c', 'v', 'https://app/cb', 'https://issuer.example', 'cid', keys);

            const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
            const [h, c] = headers.DPoP.split('.');
            expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toMatchObject({ typ: 'dpop+jwt', alg: 'ES256' });
            expect(JSON.parse(Buffer.from(c, 'base64url').toString())).toMatchObject({
                htm: 'POST',
                htu: 'https://issuer.example/token',
            });
        });

        it('retries once with the DPoP-Nonce the provider asks for', async () => {
            const keys = generateDpopKeyPair();
            fetchMock
                .mockResolvedValueOnce(jsonResponse(400, { error: 'use_dpop_nonce' }, { 'DPoP-Nonce': 'NONCE-XYZ' }))
                .mockResolvedValueOnce(jsonResponse(200, { access_token: 'a', token_type: 'DPoP' }));

            await expect(refreshAccessToken('rt', 'https://issuer.example', 'cid', keys)).resolves.toMatchObject({
                access_token: 'a',
            });

            expect(fetchMock).toHaveBeenCalledTimes(2);
            const retryHeader = (fetchMock.mock.calls[1][1].headers as Record<string, string>).DPoP;
            const claims = JSON.parse(Buffer.from(retryHeader.split('.')[1], 'base64url').toString());
            expect(claims.nonce).toBe('NONCE-XYZ');
        });

        it('does not retry more than once, even when the nonce is rejected again', async () => {
            const keys = generateDpopKeyPair();
            fetchMock.mockResolvedValue(jsonResponse(401, { error: 'use_dpop_nonce' }, { 'DPoP-Nonce': 'N' }));

            const error = await refreshAccessToken('rt', 'https://issuer.example', 'cid', keys).catch((e: unknown) => e);

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect((error as SolidOidcError).code).toBe('provider_error');
        });

        it('does not retry without a DPoP key pair', async () => {
            fetchMock.mockResolvedValue(jsonResponse(401, { error: 'x' }, { 'DPoP-Nonce': 'N' }));

            await refreshAccessToken('rt', 'https://issuer.example', 'cid').catch(() => undefined);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][1].headers.DPoP).toBeUndefined();
        });
    });
});

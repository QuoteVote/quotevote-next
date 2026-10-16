import { validateIssuerUrl } from '../../../app/solid/oidc/discovery';
import {
    parseIdToken,
    exchangeCodeForTokens,
    refreshAccessToken,
} from '../../../app/solid/oidc/authorization';
import { SolidOidcError } from '../../../app/solid/errors';

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

    describe('parseIdToken', () => {
        it('should parse valid JWT', () => {
            const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                sub: '1234567890',
                name: 'John Doe',
                webid: 'https://example.com/profile#me'
            })).toString('base64url');
            const signature = 'test_signature';

            const claims = parseIdToken(`${header}.${payload}.${signature}`);

            expect(claims).toEqual({
                sub: '1234567890',
                name: 'John Doe',
                webid: 'https://example.com/profile#me',
            });
        });

        it('should throw error for invalid JWT format', () => {
            expect(() => parseIdToken('invalid.jwt')).toThrow('Invalid JWT format');
            expect(() => parseIdToken('invalid')).toThrow('Invalid JWT format');
            expect(() => parseIdToken('')).toThrow('Invalid JWT format');
        });

        it('should throw a generic error for invalid JSON without echoing the payload', () => {
            const header = Buffer.from('header').toString('base64url');
            const payload = Buffer.from('secret-claims-not-json').toString('base64url');

            let message = '';
            try {
                parseIdToken(`${header}.${payload}.signature`);
            } catch (error) {
                message = (error as Error).message;
            }
            expect(message).toBe('Invalid ID token payload');
            expect(message).not.toMatch(/secret-claims/);
        });

        it('should reject a payload that is not a JSON object', () => {
            const header = Buffer.from('h').toString('base64url');
            const payload = Buffer.from('[1,2,3]').toString('base64url');

            expect(() => parseIdToken(`${header}.${payload}.s`)).toThrow('Invalid ID token payload');
        });
    });

    describe('token endpoint errors', () => {
        const fetchMock = jest.fn();

        beforeEach(() => {
            fetchMock.mockReset();
            global.fetch = fetchMock as unknown as typeof fetch;
        });

        const jsonResponse = (status: number, body: unknown): Response =>
            ({
                ok: status >= 200 && status < 300,
                status,
                statusText: 'x',
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
    });
});

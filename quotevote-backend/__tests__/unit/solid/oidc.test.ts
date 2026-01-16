import { validateIssuerUrl } from '../../../app/solid/oidc/discovery';
import { parseIdToken } from '../../../app/solid/oidc/authorization';

describe('Solid OIDC - Discovery and Authorization', () => {
    describe('validateIssuerUrl', () => {
        it('should validate HTTPS URLs', () => {
            expect(validateIssuerUrl('https://solidcommunity.net')).toBe(true);
            expect(validateIssuerUrl('https://example.com')).toBe(true);
        });

        it('should allow HTTP for localhost', () => {
            expect(validateIssuerUrl('http://localhost:3000')).toBe(true);
            expect(validateIssuerUrl('http://localhost')).toBe(true);
        });

        it('should reject HTTP for non-localhost', () => {
            expect(validateIssuerUrl('http://example.com')).toBe(false);
        });

        it('should reject invalid URLs', () => {
            expect(validateIssuerUrl('not-a-url')).toBe(false);
            expect(validateIssuerUrl('')).toBe(false);
            expect(validateIssuerUrl('ftp://example.com')).toBe(false);
        });
    });

    describe('parseIdToken', () => {
        it('should parse valid JWT', () => {
            // Create a simple test JWT (header.payload.signature)
            const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                sub: '1234567890',
                name: 'John Doe',
                webid: 'https://example.com/profile#me'
            })).toString('base64url');
            const signature = 'test_signature';

            const jwt = `${header}.${payload}.${signature}`;

            const claims = parseIdToken(jwt);

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

        it('should throw error for invalid JSON in payload', () => {
            const header = Buffer.from('header').toString('base64url');
            const payload = Buffer.from('not-json').toString('base64url');
            const signature = 'signature';

            const jwt = `${header}.${payload}.${signature}`;

            expect(() => parseIdToken(jwt)).toThrow();
        });
    });
});

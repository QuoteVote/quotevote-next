import crypto from 'crypto';
import { assertPublicUrl, isPrivateAddress, verifyIdToken } from '~/solid/oidc/security';

const ISSUER = 'https://issuer.example';
const CLIENT_ID = 'client-1';
const JWKS = 'https://issuer.example/jwks';

function b64(obj: unknown): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function sign(claims: Record<string, unknown>, privateKey: crypto.KeyObject, kid = 'k1'): string {
    const head = b64({ alg: 'RS256', kid });
    const body = b64(claims);
    const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), privateKey).toString('base64url');
    return `${head}.${body}.${sig}`;
}

describe('isPrivateAddress / assertPublicUrl', () => {
    it.each(['10.0.0.1', '127.0.0.1', '169.254.169.254', '192.168.1.5', '172.20.0.1', '::1', 'fd00::1', '::ffff:10.0.0.1'])(
        'flags %s as private',
        (ip) => expect(isPrivateAddress(ip)).toBe(true)
    );
    it('does not flag public addresses', () => {
        expect(isPrivateAddress('8.8.8.8')).toBe(false);
        expect(isPrivateAddress('172.32.0.1')).toBe(false);
    });
    it('rejects private literal hosts and non-https URLs', async () => {
        await expect(assertPublicUrl('https://169.254.169.254/latest')).rejects.toThrow();
        await expect(assertPublicUrl('https://10.1.2.3/x')).rejects.toThrow();
        await expect(assertPublicUrl('http://example.com/x')).rejects.toThrow();
    });
    it('accepts a public literal IP', async () => {
        await expect(assertPublicUrl('https://8.8.8.8/x')).resolves.toBeUndefined();
    });
});

describe('verifyIdToken', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', use: 'sig' };
    const claims = { iss: ISSUER, aud: CLIENT_ID, sub: 'https://pod.example/me', exp: Math.floor(Date.now() / 1000) + 600 };

    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ keys: [jwk] }) });
    });

    it('accepts a valid token', async () => {
        const out = await verifyIdToken(sign(claims, privateKey), { issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS });
        expect(out.sub).toBe(claims.sub);
    });
    it('rejects a token signed by another key', async () => {
        const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
        await expect(
            verifyIdToken(sign(claims, other), { issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS })
        ).rejects.toThrow('signature');
    });
    it('rejects wrong issuer, audience and expired tokens', async () => {
        const opts = { issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS };
        await expect(verifyIdToken(sign({ ...claims, iss: 'https://evil.example' }, privateKey), opts)).rejects.toThrow('issuer');
        await expect(verifyIdToken(sign({ ...claims, aud: 'x' }, privateKey), opts)).rejects.toThrow('audience');
        await expect(verifyIdToken(sign({ ...claims, exp: 1 }, privateKey), opts)).rejects.toThrow('expired');
    });
});

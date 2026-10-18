import crypto from 'crypto';
import dns from 'dns';
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

describe('isPrivateAddress', () => {
    it.each([
        '0.0.0.1',
        '10.0.0.1',
        '100.64.0.1',
        '127.0.0.1',
        '169.254.169.254',
        '172.16.0.1',
        '172.31.255.255',
        '192.0.0.1',
        '192.168.1.5',
        '198.18.0.1',
        '198.19.255.255',
        '224.0.0.1',
        '240.0.0.1',
        '255.255.255.255',
    ])('flags IPv4 %s as blocked', (ip) => expect(isPrivateAddress(ip)).toBe(true));

    it.each([
        '::1',
        '::',
        'fc00::1',
        'fd12:3456::1',
        'fe80::1',
        'febf::1',
        'ff02::1',
        '64:ff9b::808:808', // NAT64 well-known prefix
        '::ffff:10.0.0.1', // IPv4-mapped, dotted
        '::ffff:a9fe:a9fe', // IPv4-mapped 169.254.169.254, hex (WHATWG URL form)
        '::ffff:7f00:1', // IPv4-mapped 127.0.0.1, hex
        '::ffff:c0a8:101', // IPv4-mapped 192.168.1.1, hex
        '[::ffff:a9fe:a9fe]', // bracketed
    ])('flags IPv6 %s as blocked', (ip) => expect(isPrivateAddress(ip)).toBe(true));

    it.each(['8.8.8.8', '172.32.0.1', '100.128.0.1', '198.20.0.1', '223.255.255.255', '2606:4700:4700::1111', '::ffff:808:808'])(
        'does not flag public address %s',
        (ip) => expect(isPrivateAddress(ip)).toBe(false)
    );
});

describe('assertPublicUrl', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects private literal hosts and non-https URLs', async () => {
        await expect(assertPublicUrl('https://169.254.169.254/latest')).rejects.toThrow();
        await expect(assertPublicUrl('https://10.1.2.3/x')).rejects.toThrow();
        await expect(assertPublicUrl('http://example.com/x')).rejects.toThrow();
    });

    it('accepts a public literal IP', async () => {
        await expect(assertPublicUrl('https://8.8.8.8/x')).resolves.toBeUndefined();
    });

    it.each([
        'https://[::ffff:169.254.169.254]/', // WHATWG normalises to [::ffff:a9fe:a9fe]
        'https://[::ffff:127.0.0.1]/',
        'https://[64:ff9b::a9fe:a9fe]/', // NAT64 embedding 169.254.169.254
        'https://[fe80::1]/',
        'https://198.18.0.1/',
        'https://224.0.0.1/',
        'https://240.0.0.1/',
    ])('rejects %s', async (url) => {
        await expect(assertPublicUrl(url)).rejects.toThrow('not allowed');
    });

    it('rejects a public-looking hostname that resolves to a private address', async () => {
        jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '10.0.0.5', family: 4 }] as never);
        await expect(assertPublicUrl('https://pod.example/x')).rejects.toThrow('not allowed');
    });

    it('rejects a hostname that resolves to an IPv4-mapped private address', async () => {
        jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '::ffff:a9fe:a9fe', family: 6 }] as never);
        await expect(assertPublicUrl('https://pod.example/x')).rejects.toThrow('not allowed');
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

    it('fetches the JWKS without following redirects', async () => {
        await verifyIdToken(sign(claims, privateKey), { issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS });
        expect((global.fetch as jest.Mock).mock.calls[0][1].redirect).toBe('error');
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

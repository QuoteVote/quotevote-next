import crypto from 'crypto';
import dns from 'dns';
import net from 'net';

/**
 * Network and token-verification guards for the Solid integration.
 * - assertPublicUrl: blocks SSRF to private / loopback / link-local hosts.
 * - verifyIdToken: verifies the ID token signature (JWKS), issuer, audience and expiry.
 */

const IPV4_PRIVATE: Array<[number, number]> = [
    [0x00000000, 8], // 0.0.0.0/8
    [0x0a000000, 8], // 10.0.0.0/8
    [0x64400000, 10], // 100.64.0.0/10
    [0x7f000000, 8], // 127.0.0.0/8
    [0xa9fe0000, 16], // 169.254.0.0/16
    [0xac100000, 12], // 172.16.0.0/12
    [0xc0a80000, 16], // 192.168.0.0/16
];

function ipv4ToInt(ip: string): number {
    return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

export function isPrivateAddress(address: string): boolean {
    const ip = address.startsWith('[') ? address.slice(1, -1) : address;
    if (net.isIPv4(ip)) {
        const n = ipv4ToInt(ip);
        return IPV4_PRIVATE.some(([base, bits]) => {
            const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
            return (n & mask) >>> 0 === base;
        });
    }
    if (net.isIPv6(ip)) {
        const lower = ip.toLowerCase();
        if (lower === '::1' || lower === '::') return true;
        const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
        if (mapped) return isPrivateAddress(mapped[1]);
        return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
    }
    return false;
}

function isDevLoopback(hostname: string): boolean {
    return (
        process.env.NODE_ENV !== 'production' &&
        (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]')
    );
}

/**
 * Throws when the URL targets a private/loopback/link-local address.
 * Loopback is allowed outside production for local development issuers.
 * ponytail: resolve-then-fetch leaves a DNS-rebinding window; pin the resolved IP if that matters.
 */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL');
    }
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isDevLoopback(url.hostname))) {
        throw new Error('URL must use https');
    }
    if (isDevLoopback(url.hostname)) return;

    const host = url.hostname;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
        throw new Error('URL host is not allowed');
    }
    if (net.isIP(host.replace(/^\[|\]$/g, ''))) {
        if (isPrivateAddress(host)) throw new Error('URL host is not allowed');
        return;
    }

    let addresses: dns.LookupAddress[];
    try {
        addresses = await dns.promises.lookup(host, { all: true });
    } catch {
        return; // unresolvable: the subsequent fetch fails on its own
    }
    if (addresses.some((a) => isPrivateAddress(a.address))) {
        throw new Error('URL host is not allowed');
    }
}

interface Jwk extends crypto.JsonWebKey {
    kid?: string;
    alg?: string;
    use?: string;
}

function decodePart<T>(part: string): T {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T;
}

/**
 * Verify an ID token against the issuer's JWKS and return its claims.
 * Supports RS256 / ES256 (the algorithms Solid-OIDC providers use).
 */
export async function verifyIdToken(
    idToken: string,
    opts: { issuer: string; clientId: string; jwksUri: string }
): Promise<Record<string, unknown>> {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error('Invalid ID token');

    let header: { alg?: string; kid?: string };
    let claims: Record<string, unknown>;
    try {
        header = decodePart(parts[0]);
        claims = decodePart(parts[1]);
    } catch {
        throw new Error('Invalid ID token');
    }
    if (header.alg !== 'RS256' && header.alg !== 'ES256') {
        throw new Error('Unsupported ID token algorithm');
    }

    await assertPublicUrl(opts.jwksUri);
    const response = await fetch(opts.jwksUri, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Failed to fetch issuer keys');
    const { keys } = (await response.json()) as { keys?: Jwk[] };

    const candidates = (keys ?? []).filter(
        (k) => (!header.kid || k.kid === header.kid) && (!k.use || k.use === 'sig')
    );
    const signature = Buffer.from(parts[2], 'base64url');
    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const verified = candidates.some((jwk) => {
        try {
            const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
            return crypto.verify(
                'sha256',
                signed,
                header.alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key,
                signature
            );
        } catch {
            return false;
        }
    });
    if (!verified) throw new Error('ID token signature verification failed');

    const normalize = (v: string): string => v.replace(/\/+$/, '');
    if (typeof claims.iss !== 'string' || normalize(claims.iss) !== normalize(opts.issuer)) {
        throw new Error('ID token issuer mismatch');
    }
    const aud = claims.aud;
    const audOk = Array.isArray(aud) ? aud.includes(opts.clientId) : aud === opts.clientId;
    if (!audOk) throw new Error('ID token audience mismatch');
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
        throw new Error('ID token expired');
    }
    return claims;
}

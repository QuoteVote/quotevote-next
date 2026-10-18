import crypto from 'crypto';
import dns from 'dns';
import net from 'net';

/**
 * Network and token-verification guards for the Solid integration.
 * - assertPublicUrl: blocks SSRF to private / loopback / link-local / reserved hosts.
 * - verifyIdToken: verifies the ID token signature (JWKS), issuer, audience and expiry.
 *
 * Outbound requests in the Solid code also use `redirect: 'error'`, so a public host
 * cannot bounce a request to an internal address after the check has passed.
 */

const blockList = new net.BlockList();

// IPv4 ranges that must never be reached from the server.
const BLOCKED_IPV4: Array<[string, number]> = [
    ['0.0.0.0', 8], // "this" network
    ['10.0.0.0', 8], // private
    ['100.64.0.0', 10], // carrier-grade NAT
    ['127.0.0.0', 8], // loopback
    ['169.254.0.0', 16], // link-local (cloud metadata)
    ['172.16.0.0', 12], // private
    ['192.0.0.0', 24], // IETF protocol assignments
    ['192.168.0.0', 16], // private
    ['198.18.0.0', 15], // benchmarking
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved (includes 255.255.255.255)
];

// IPv6 ranges that must never be reached from the server.
const BLOCKED_IPV6: Array<[string, number]> = [
    ['::', 128], // unspecified
    ['::1', 128], // loopback
    ['fc00::', 7], // unique local
    ['fe80::', 10], // link-local
    ['ff00::', 8], // multicast
    ['64:ff9b::', 96], // NAT64 (embeds IPv4)
];

for (const [base, bits] of BLOCKED_IPV4) blockList.addSubnet(base, bits, 'ipv4');
for (const [base, bits] of BLOCKED_IPV6) blockList.addSubnet(base, bits, 'ipv6');

/**
 * Returns true when the address is private, loopback, link-local or otherwise reserved.
 * IPv4-mapped IPv6 (`::ffff:a.b.c.d` and the hex form `::ffff:xxxx:xxxx`, as produced by
 * WHATWG URL parsing) is checked against the IPv4 ranges; BlockList does this on Node 24.
 * Accepts bracketed IPv6 literals.
 */
export function isPrivateAddress(address: string): boolean {
    const ip = stripBrackets(address);
    const family = net.isIPv4(ip) ? 'ipv4' : net.isIPv6(ip) ? 'ipv6' : null;
    if (!family) return false;
    return blockList.check(ip, family);
}

function stripBrackets(host: string): string {
    return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

function isDevLoopback(hostname: string): boolean {
    const host = stripBrackets(hostname);
    return (
        process.env.NODE_ENV !== 'production' &&
        (host === 'localhost' || host === '127.0.0.1' || host === '::1')
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

    const host = stripBrackets(url.hostname);
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
        throw new Error('URL host is not allowed');
    }
    if (net.isIP(host)) {
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
        redirect: 'error',
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

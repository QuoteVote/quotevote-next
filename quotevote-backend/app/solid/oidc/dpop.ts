import crypto from 'crypto';

/**
 * DPoP (RFC 9449) proofs for Solid-OIDC. Solid providers issue DPoP-bound tokens, so the
 * access token is only accepted together with a proof signed by the key it was issued to.
 * Keys are ES256 (P-256) and are generated per connection, then stored encrypted.
 */

export interface DpopPublicJwk {
    kty: 'EC';
    crv: 'P-256';
    x: string;
    y: string;
}

export interface DpopPrivateJwk extends DpopPublicJwk {
    d: string;
}

export interface DpopKeyPair {
    publicJwk: DpopPublicJwk;
    privateJwk: DpopPrivateJwk;
}

export interface DpopProofInput {
    privateJwk: DpopPrivateJwk;
    publicJwk: DpopPublicJwk;
    method: string;
    url: string;
    accessToken?: string;
    nonce?: string;
}

/** Generate a fresh ES256 key pair for DPoP. */
export function generateDpopKeyPair(): DpopKeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pub = publicKey.export({ format: 'jwk' });
    const priv = privateKey.export({ format: 'jwk' });
    return {
        publicJwk: { kty: 'EC', crv: 'P-256', x: pub.x as string, y: pub.y as string },
        privateJwk: { kty: 'EC', crv: 'P-256', x: priv.x as string, y: priv.y as string, d: priv.d as string },
    };
}

/** Validate a stored key pair. Returns null when neither key is present, throws when malformed. */
export function readDpopKeyPair(privateJwk: unknown, publicJwk: unknown): DpopKeyPair | null {
    if (privateJwk === undefined && publicJwk === undefined) {
        return null;
    }
    const pub = publicJwk as Partial<DpopPublicJwk> | null;
    const priv = privateJwk as Partial<DpopPrivateJwk> | null;
    const isEc = (k: { kty?: unknown; crv?: unknown; x?: unknown; y?: unknown } | null): boolean =>
        !!k && k.kty === 'EC' && k.crv === 'P-256' && typeof k.x === 'string' && typeof k.y === 'string';
    if (!isEc(pub) || !isEc(priv) || typeof priv?.d !== 'string') {
        throw new Error('Stored DPoP key is malformed');
    }
    return {
        publicJwk: { kty: 'EC', crv: 'P-256', x: pub!.x as string, y: pub!.y as string },
        privateJwk: { kty: 'EC', crv: 'P-256', x: priv!.x as string, y: priv!.y as string, d: priv!.d },
    };
}

function base64UrlJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** htu is the request URI without query and fragment (RFC 9449 section 4.2). */
function stripQueryAndFragment(url: string): string {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.href;
}

/**
 * Build a signed DPoP proof JWT.
 * @returns compact JWS: header.payload.signature
 */
export function createDpopProof(input: DpopProofInput): string {
    const header = { typ: 'dpop+jwt', alg: 'ES256', jwk: input.publicJwk };
    const claims: Record<string, unknown> = {
        jti: crypto.randomUUID(),
        htm: input.method.toUpperCase(),
        htu: stripQueryAndFragment(input.url),
        iat: Math.floor(Date.now() / 1000),
    };
    if (input.nonce) {
        claims.nonce = input.nonce;
    }
    if (input.accessToken) {
        claims.ath = crypto.createHash('sha256').update(input.accessToken, 'ascii').digest('base64url');
    }

    const signingInput = `${base64UrlJson(header)}.${base64UrlJson(claims)}`;
    const key = crypto.createPrivateKey({ key: input.privateJwk as crypto.JsonWebKey, format: 'jwk' });
    const signature = crypto.sign('sha256', Buffer.from(signingInput), {
        key,
        dsaEncoding: 'ieee-p1363',
    });
    return `${signingInput}.${signature.toString('base64url')}`;
}

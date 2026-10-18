import crypto from 'crypto';
import { createDpopProof, generateDpopKeyPair, readDpopKeyPair } from '~/solid/oidc/dpop';

function decode(proof: string): { header: Record<string, unknown>; claims: Record<string, unknown>; signed: string; sig: Buffer } {
    const [h, c, s] = proof.split('.');
    return {
        header: JSON.parse(Buffer.from(h, 'base64url').toString('utf8')),
        claims: JSON.parse(Buffer.from(c, 'base64url').toString('utf8')),
        signed: `${h}.${c}`,
        sig: Buffer.from(s, 'base64url'),
    };
}

function verifyWith(jwk: crypto.JsonWebKey, signed: string, sig: Buffer): boolean {
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    return crypto.verify('sha256', Buffer.from(signed), { key, dsaEncoding: 'ieee-p1363' }, sig);
}

describe('generateDpopKeyPair', () => {
    it('creates an EC P-256 key pair with no private material in the public key', () => {
        const { publicJwk, privateJwk } = generateDpopKeyPair();

        expect(publicJwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
        expect(typeof publicJwk.x).toBe('string');
        expect(typeof publicJwk.y).toBe('string');
        expect(publicJwk).not.toHaveProperty('d');
        expect(privateJwk.d).toEqual(expect.any(String));
    });

    it('creates a different key pair each time', () => {
        expect(generateDpopKeyPair().publicJwk).not.toEqual(generateDpopKeyPair().publicJwk);
    });
});

describe('createDpopProof', () => {
    const keys = generateDpopKeyPair();
    const base = { privateJwk: keys.privateJwk, publicJwk: keys.publicJwk };

    it('produces an ES256 dpop+jwt whose signature verifies with the embedded public key', () => {
        const proof = createDpopProof({ ...base, method: 'post', url: 'https://pod.example/resource' });
        const { header, signed, sig } = decode(proof);

        expect(header).toEqual({ typ: 'dpop+jwt', alg: 'ES256', jwk: keys.publicJwk });
        expect(verifyWith(header.jwk as crypto.JsonWebKey, signed, sig)).toBe(true);
    });

    it('rejects the signature when the proof is tampered with', () => {
        const proof = createDpopProof({ ...base, method: 'GET', url: 'https://pod.example/resource' });
        const { header, claims, sig } = decode(proof);
        const forged = Buffer.from(JSON.stringify({ ...claims, htm: 'DELETE' })).toString('base64url');
        const signed = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${forged}`;

        expect(verifyWith(header.jwk as crypto.JsonWebKey, signed, sig)).toBe(false);
    });

    it('strips the query and fragment from htu and uppercases htm', () => {
        const proof = createDpopProof({
            ...base,
            method: 'put',
            url: 'https://pod.example/private/x?token=secret&a=1#frag',
        });

        expect(decode(proof).claims).toMatchObject({
            htm: 'PUT',
            htu: 'https://pod.example/private/x',
        });
        expect(JSON.stringify(decode(proof).claims)).not.toMatch(/secret|frag/);
    });

    it('sets ath to the base64url SHA-256 of the access token', () => {
        const proof = createDpopProof({ ...base, method: 'GET', url: 'https://pod.example/x', accessToken: 'AT-123' });
        const expected = crypto.createHash('sha256').update('AT-123').digest('base64url');

        expect(decode(proof).claims.ath).toBe(expected);
    });

    it('omits ath without an access token and includes nonce only when given', () => {
        const plain = decode(createDpopProof({ ...base, method: 'POST', url: 'https://issuer.example/token' })).claims;
        expect(plain).not.toHaveProperty('ath');
        expect(plain).not.toHaveProperty('nonce');

        const withNonce = decode(
            createDpopProof({ ...base, method: 'POST', url: 'https://issuer.example/token', nonce: 'N-1' })
        ).claims;
        expect(withNonce.nonce).toBe('N-1');
    });

    it('gives every proof a unique jti and a current iat', () => {
        const a = decode(createDpopProof({ ...base, method: 'GET', url: 'https://pod.example/x' })).claims;
        const b = decode(createDpopProof({ ...base, method: 'GET', url: 'https://pod.example/x' })).claims;

        expect(a.jti).not.toBe(b.jti);
        expect(Math.abs((a.iat as number) - Math.floor(Date.now() / 1000))).toBeLessThanOrEqual(2);
    });
});

describe('readDpopKeyPair', () => {
    const keys = generateDpopKeyPair();

    it('returns null when no key is stored (legacy connection)', () => {
        expect(readDpopKeyPair(undefined, undefined)).toBeNull();
    });

    it('returns a validated copy of a stored key pair', () => {
        expect(readDpopKeyPair(keys.privateJwk, keys.publicJwk)).toEqual(keys);
    });

    it.each([
        ['only the private key', () => [keys.privateJwk, undefined]],
        ['a non-EC key', () => [{ ...keys.privateJwk, kty: 'RSA' }, keys.publicJwk]],
        ['a private key without d', () => [{ ...keys.privateJwk, d: undefined }, keys.publicJwk]],
    ])('throws a generic error for %s', (_label, make) => {
        const [priv, pub] = make();
        expect(() => readDpopKeyPair(priv, pub)).toThrow('Stored DPoP key is malformed');
    });
});

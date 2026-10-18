import { assertPublicUrl } from './security';
import { extractIssuersFromJsonLd } from './discovery';
import { SolidOidcError } from '../errors';

/**
 * WebID profile check: the WebID named in the verified ID token must dereference to a
 * document that lists the issuer that issued the token as `solid:oidcIssuer`.
 * Without this, a WebID hosted by someone else could be attached to a connection.
 */

const WEBID_TIMEOUT_MS = 10000;
const WEBID_ACCEPT = 'application/ld+json, application/json, text/turtle';
const TURTLE_ISSUER_PATTERN =
    /(?:solid:oidcIssuer|<http:\/\/www\.w3\.org\/ns\/solid\/terms#oidcIssuer>)\s+((?:<[^>]+>\s*,?\s*)+)/g;

/** True only for absolute https URLs. */
export function isHttpsUrl(value: string): boolean {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

/** Compare issuers without trailing slashes. */
export function normaliseIssuer(value: string): string {
    return value.replace(/\/+$/, '');
}

/**
 * Extract every `solid:oidcIssuer` from a WebID document (JSON-LD or Turtle).
 * Returns an empty list when none is found; it never falls back to the origin.
 */
export function parseWebIdIssuers(body: string, contentType: string): string[] {
    if (contentType.includes('json')) {
        try {
            return extractIssuersFromJsonLd(JSON.parse(body));
        } catch {
            return [];
        }
    }

    const issuers: string[] = [];
    for (const match of body.matchAll(TURTLE_ISSUER_PATTERN)) {
        for (const iri of match[1].matchAll(/<([^>]+)>/g)) {
            issuers.push(iri[1]);
        }
    }
    return issuers;
}

/**
 * Dereference the WebID and require that it lists `issuer` as `solid:oidcIssuer`.
 * @throws {SolidOidcError} code `invalid_response` for a non-https WebID, a fetch failure,
 *   a non-2xx status, or a profile that does not list the issuer.
 */
export async function assertWebIdListsIssuer(webId: string, issuer: string): Promise<void> {
    if (!isHttpsUrl(webId)) {
        throw new SolidOidcError('invalid_response', 'WebID must use https');
    }

    let response: Response;
    let body: string;
    try {
        await assertPublicUrl(webId);
        response = await fetch(webId, {
            headers: { Accept: WEBID_ACCEPT },
            redirect: 'error',
            signal: AbortSignal.timeout(WEBID_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error('WebID request failed');
        }
        body = await response.text();
    } catch {
        throw new SolidOidcError('invalid_response', 'WebID document could not be fetched');
    }

    const expected = normaliseIssuer(issuer);
    const listed = parseWebIdIssuers(body, response.headers.get('content-type') ?? '');
    if (!listed.some((value) => normaliseIssuer(value) === expected)) {
        throw new SolidOidcError('invalid_response', 'WebID does not list the token issuer');
    }
}

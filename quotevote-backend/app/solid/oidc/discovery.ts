import { assertPublicUrl } from './security';
/**
 * Solid OIDC Issuer Discovery
 * Implements OpenID Connect Discovery for Solid Pods
 */

export interface IssuerMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    registration_endpoint?: string;
    scopes_supported?: string[];
    response_types_supported?: string[];
    grant_types_supported?: string[];
    subject_types_supported?: string[];
    id_token_signing_alg_values_supported?: string[];
    userinfo_endpoint?: string;
    end_session_endpoint?: string;
}

/**
 * Discover OIDC issuer metadata from WebID or issuer URL
 * @param issuerOrWebId - Issuer URL or WebID
 * @returns Issuer metadata
 */
export async function discoverIssuer(issuerOrWebId: string): Promise<IssuerMetadata> {
    let issuerUrl: string;

    // If it looks like a WebID (contains path), extract the issuer
    if (issuerOrWebId.includes('/profile') || issuerOrWebId.includes('#')) {
        issuerUrl = await discoverIssuerFromWebId(issuerOrWebId);
    } else {
        issuerUrl = issuerOrWebId;
    }

    // Ensure issuer URL ends without trailing slash
    issuerUrl = issuerUrl.replace(/\/$/, '');

    // Fetch OpenID Configuration
    const wellKnownUrl = `${issuerUrl}/.well-known/openid-configuration`;

    try {
        await assertPublicUrl(wellKnownUrl);
        const response = await fetch(wellKnownUrl, {
            headers: {
                'Accept': 'application/json',
            },
            redirect: 'error',
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch issuer metadata: ${response.status} ${response.statusText}`
            );
        }

        const metadata = await response.json() as IssuerMetadata;

        // Validate required fields
        if (!metadata.issuer || !metadata.authorization_endpoint || !metadata.token_endpoint) {
            throw new Error('Invalid issuer metadata: missing required fields');
        }

        // Endpoints come from a user-chosen issuer: never let them point at internal hosts.
        await assertPublicUrl(metadata.token_endpoint);
        await assertPublicUrl(metadata.authorization_endpoint);

        return metadata;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Issuer discovery failed for ${issuerUrl}: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Discover issuer from WebID by fetching the WebID document
 * @param webId - User's WebID
 * @returns Issuer URL
 */
async function discoverIssuerFromWebId(webId: string): Promise<string> {
    try {
        await assertPublicUrl(webId);
        const response = await fetch(webId, {
            headers: {
                'Accept': 'application/ld+json, application/json, text/turtle',
            },
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch WebID: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Try to extract issuer from response
        if (contentType.includes('json')) {
            const data = await response.json();

            // Look for solid:oidcIssuer in JSON-LD
            const issuer = extractIssuerFromJsonLd(data);
            if (issuer) {
                return issuer;
            }
        }

        // Fallback: use the origin of the WebID as issuer
        const url = new URL(webId);
        return `${url.protocol}//${url.host}`;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to discover issuer from WebID ${webId}: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Every solid:oidcIssuer value in a JSON-LD WebID document (compact or full IRI keys,
 * `{ "@id": ... }` values, arrays and `@graph`). No fallback: callers decide what an
 * empty result means.
 * @param data - Parsed JSON-LD
 * @returns Issuer URLs in document order (possibly empty)
 */
export function extractIssuersFromJsonLd(data: unknown): string[] {
    if (!data || typeof data !== 'object') {
        return [];
    }
    if (Array.isArray(data)) {
        return data.flatMap((item) => extractIssuersFromJsonLd(item));
    }

    const obj = data as Record<string, unknown>;
    const issuers: string[] = [];
    for (const key of ['solid:oidcIssuer', 'http://www.w3.org/ns/solid/terms#oidcIssuer']) {
        const values: unknown[] = Array.isArray(obj[key]) ? (obj[key] as unknown[]) : [obj[key]];
        for (const value of values) {
            if (typeof value === 'string') {
                issuers.push(value);
            } else if (value && typeof value === 'object' && typeof (value as { '@id'?: unknown })['@id'] === 'string') {
                issuers.push((value as { '@id': string })['@id']);
            }
        }
    }

    return [...issuers, ...extractIssuersFromJsonLd(obj['@graph'])];
}

/**
 * First solid:oidcIssuer in a JSON-LD WebID document, or null.
 */
function extractIssuerFromJsonLd(data: unknown): string | null {
    return extractIssuersFromJsonLd(data)[0] ?? null;
}

/**
 * Validate issuer URL format
 * @param issuer - Issuer URL to validate
 * @returns true if valid
 */
export function validateIssuerUrl(issuer: string): boolean {
    if (typeof issuer !== 'string' || issuer.length > 2048) {
        return false;
    }
    try {
        const url = new URL(issuer);
        // Issuers never carry credentials or fragments.
        if (url.username || url.password || url.hash) {
            return false;
        }
        if (url.protocol === 'https:') {
            return true;
        }
        // Plain HTTP is only tolerated for loopback development issuers.
        const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        return url.protocol === 'http:' && isLoopback && process.env.NODE_ENV !== 'production';
    } catch {
        return false;
    }
}

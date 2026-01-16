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
        const response = await fetch(wellKnownUrl, {
            headers: {
                'Accept': 'application/json',
            },
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
        const response = await fetch(webId, {
            headers: {
                'Accept': 'application/ld+json, application/json, text/turtle',
            },
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
 * Extract issuer from JSON-LD WebID document
 * @param data - JSON-LD data
 * @returns Issuer URL or null
 */
function extractIssuerFromJsonLd(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const obj = data as Record<string, unknown>;

    // Check for solid:oidcIssuer
    if (typeof obj['solid:oidcIssuer'] === 'string') {
        return obj['solid:oidcIssuer'];
    }

    // Check for http://www.w3.org/ns/solid/terms#oidcIssuer
    if (typeof obj['http://www.w3.org/ns/solid/terms#oidcIssuer'] === 'string') {
        return obj['http://www.w3.org/ns/solid/terms#oidcIssuer'];
    }

    // Check nested objects
    if (typeof obj['@graph'] === 'object' && Array.isArray(obj['@graph'])) {
        for (const item of obj['@graph']) {
            const issuer = extractIssuerFromJsonLd(item);
            if (issuer) {
                return issuer;
            }
        }
    }

    return null;
}

/**
 * Validate issuer URL format
 * @param issuer - Issuer URL to validate
 * @returns true if valid
 */
export function validateIssuerUrl(issuer: string): boolean {
    try {
        const url = new URL(issuer);
        return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost');
    } catch {
        return false;
    }
}

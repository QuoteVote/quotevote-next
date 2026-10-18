/**
 * Typed errors for the Solid integration.
 *
 * Messages are deliberately generic: they never include provider response
 * bodies, tokens, authorization codes or PKCE verifiers. Resolvers map these
 * classes to GraphQL error codes (see app/data/resolvers/solidResolvers.ts).
 */

/** OIDC token endpoint failure codes. */
export type SolidOidcErrorCode =
    /** The refresh token / authorization code was rejected; the user must reconnect. */
    | 'invalid_grant'
    /** Issuer discovery, network, timeout or non-2xx status from the provider. */
    | 'provider_error'
    /** Provider answered 2xx but the token payload was unusable. */
    | 'invalid_response';

export class SolidOidcError extends Error {
    readonly code: SolidOidcErrorCode;
    readonly status?: number;

    constructor(code: SolidOidcErrorCode, message: string, status?: number) {
        super(message);
        this.name = 'SolidOidcError';
        this.code = code;
        this.status = status;
    }
}

/** Pod (resource server) failures: timeouts, network errors, HTTP status errors. */
export class SolidPodError extends Error {
    readonly kind: 'timeout' | 'network' | 'http';
    readonly status?: number;

    constructor(kind: 'timeout' | 'network' | 'http', message: string, status?: number) {
        super(message);
        this.name = 'SolidPodError';
        this.kind = kind;
        this.status = status;
    }
}

/** The user has no Solid connection (or it was removed). */
export class SolidNotConnectedError extends Error {
    constructor() {
        super('Solid Pod is not connected');
        this.name = 'SolidNotConnectedError';
    }
}

/** Portable state input failed validation (e.g. unknown theme value). */
export class SolidInvalidInputError extends Error {
    constructor(message = 'Invalid portable state input') {
        super(message);
        this.name = 'SolidInvalidInputError';
    }
}

/** Activity ledger requested while SOLID_ACTIVITY_LEDGER_ENABLED is off. */
export class SolidFeatureDisabledError extends Error {
    constructor() {
        super('Activity ledger is not enabled');
        this.name = 'SolidFeatureDisabledError';
    }
}

/** Server-side Solid configuration is missing or invalid (e.g. SOLID_CLIENT_ID). Never shown to clients. */
export class SolidConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SolidConfigError';
    }
}

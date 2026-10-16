# Solid Pod Integration

This module implements backend support for Solid Pod integration in Quote.Vote (issue #511): users connect a Solid Pod via Solid-OIDC and sync portable user data with it.

## Overview

Quote.Vote users can:
- Connect a Solid Pod to their account via Solid-OIDC (authorization code flow with PKCE)
- Pull and push portable profile/preferences data, and optionally append to an activity ledger
- Keep their data ownership while using Quote.Vote services

## Architecture

```
app/solid/
├── oidc/                 # OpenID Connect
│   ├── discovery.ts      # Issuer discovery and issuer URL validation
│   └── authorization.ts  # Authorization URL, code exchange, refresh, ID token parsing
├── client/
│   └── solidClient.ts    # Authenticated Pod fetch with refresh-on-expiry and retry-on-401
├── storage/
│   └── encryption.ts     # AES-256-GCM helpers for token and PKCE verifier storage
├── sync/
│   └── syncService.ts    # Pull / push / append operations
├── schemas/
│   └── portable.ts       # Portable data contract (schema version 0)
├── errors.ts             # Typed errors mapped to GraphQL codes by the resolvers
└── index.ts              # Module exports

app/data/resolvers/solidResolvers.ts  # GraphQL entry points (scoped to context.userId)
prisma/schema/solid.prisma            # SolidConnection and SolidAuthState models
```

## Persistence (Prisma)

The runtime uses Prisma (MongoDB provider). Two models live in `prisma/schema/solid.prisma`:

| Model | Collection | Purpose |
| --- | --- | --- |
| `SolidConnection` | `solidconnections` | One connection per user (`userId` unique). Holds `webId`, `issuer`, AES-256-GCM `encryptedTokens`, `scopes`, minimal `idTokenClaims`, `tokenExpiry`, derived `resourceUris`, `lastSyncAt`. Back-relation `User.solidConnection`, cascade delete. |
| `SolidAuthState` | `solidauthstates` | Short-lived OIDC state (`state` unique, `userId`, `issuer`, `redirectUri`, encrypted PKCE verifier, `expiresAt`). Rows are single use. |

### Migration / compatibility note

The legacy Mongoose model was registered as `SolidConnection`, so its default collection name was `solidconnections`. The Prisma model maps to the same collection, and the field names are unchanged. **No data migration is required**: existing documents are read directly. Mongoose's `SolidConnection` model and its tests have been removed. The `webId` index is kept (`@@index([webId])`).

## OIDC Connection Flow

1. **`solidStartConnect(issuer)`**
   - Validates the issuer (see "Issuer rules" below).
   - Deletes expired `SolidAuthState` rows.
   - Generates `state` and a PKCE verifier. Stores `{state, userId, issuer, redirectUri, encryptedVerifier, expiresAt: now + 10 min}`. The verifier is encrypted with `SOLID_TOKEN_ENCRYPTION_KEY`.
   - Returns the provider `authorizationUrl` (`code_challenge_method=S256`).
   - `redirectUri` is the **frontend** page `${SOLID_REDIRECT_URI_BASE || CLIENT_URL || http://localhost:3000}/settings/solid/callback`.
2. The provider redirects the browser to that frontend page with `code` and `state`. The frontend calls **`solidFinishConnect(code, state, redirectUri)`**.
3. **`solidFinishConnect`**
   - Looks up the state. If it is missing, belongs to another user, has expired, or the `redirectUri` differs, it returns the same generic `BAD_USER_INPUT` error. Unknown and foreign states get the same response, so they cannot be probed.
   - Consumes the row immediately (`deleteMany` with the user id, count must be 1). A state can never be replayed, even after a failed attempt.
   - Exchanges the code with the stored verifier at the issuer's token endpoint.
   - Takes the WebID from the ID token `webid` claim, falling back to `sub`. It must be an absolute http(s) URL.
   - Upserts the single `SolidConnection` for the user. A reconnect replaces tokens, scopes and claims, and resets `resourceUris` and `lastSyncAt`.
   - Stores only the claims `sub`, `webid`, `iss`, `aud` and `exp`.
4. **`solidDisconnect`** deletes only the caller's connection and pending states.

### Issuer rules

- `https://` issuers are accepted.
- `http://` is accepted only for `localhost` / `127.0.0.1`, and only when `NODE_ENV !== 'production'`.
- Issuers with credentials or a fragment are rejected.

### Token lifecycle

- Access tokens are refreshed when they expire within 5 minutes.
- A 401 from the Pod triggers one refresh and one retry.
- The refresh response is merged into the stored tokens. The refresh token and ID token are kept when the provider omits them.
- A rejected refresh (`invalid_grant`), or a missing refresh token, is reported as `SOLID_REAUTH_REQUIRED`. The user must reconnect.

## Sync: Source-of-Truth and Conflict Policy

| Operation | Behaviour |
| --- | --- |
| `solidPullPortableState` | Reads profile, preferences and (if enabled) the ledger from the Pod and **returns them to the caller**. Nothing is written to Quote.Vote automatically. The client decides what to apply. |
| `solidPushPortableState` | Fields supplied by the member **overwrite the same fields in the Pod**. All other Pod fields are preserved (partial and nested merge). Unknown `theme` / `fontScale` values are rejected before any Pod call. |
| `solidAppendActivityEvent` | Feature-flagged. Appends one event to the Pod ledger. A ledger with an unexpected shape is not overwritten. |
| Civic / governance data | Never synced. It stays **instance-authoritative** (Quote.Vote is the source of truth). |

Missing Pod resources (HTTP 404) fall back to defaults. Any other Pod failure propagates. A transient read error therefore cannot make a push overwrite Pod data with defaults.

## Errors

Resolvers return `GraphQLError`s with stable `extensions.code` values and generic messages. Messages never contain tokens, codes, verifiers, or provider response bodies. Provider bodies are not read beyond the OAuth `error` field, which is only compared to `invalid_grant`.

| Code | When |
| --- | --- |
| `UNAUTHENTICATED` | No authenticated user. |
| `BAD_USER_INPUT` | Invalid issuer, invalid or expired authorization state, invalid payload, invalid theme value, or no Solid connection. |
| `SOLID_REAUTH_REQUIRED` | Refresh or code exchange rejected (`invalid_grant`), or Pod returned 401 after refresh. The user must reconnect. |
| `SOLID_UNAVAILABLE` | Pod or provider timeout, network error, 403/5xx, discovery failure, or any unexpected internal failure. |

Errors are logged with the class name, HTTP status and error kind only, never with the message.

## Portable Data Contract

Schema version: `PORTABLE_SCHEMA_VERSION = "0"` (`portableSchemaVersion` in the pulled state).

Readers must check `portableSchemaVersion` and ignore unknown fields. Any breaking change to the shapes below bumps the version.

```typescript
// Profile
{ displayName: string; avatarUrl: string | null; bio: string | null }

// Preferences
{
  theme: 'system' | 'light' | 'dark';
  notifications: { email: boolean; push: boolean; inApp: boolean };
  accessibility: { reduceMotion: boolean; fontScale: 'normal' | 'large' };
}

// Activity ledger (optional, feature-flagged)
{ events: Array<{ type: 'PostCreated' | 'QuoteCreated' | 'VoteCast' | 'BookmarkAdded';
                  instanceId: string; resourceUrl: string; timestamp: string; payload: object }> }
```

Default Pod resource locations, derived from the WebID origin when not already stored:
- Profile: `{origin}/public/quote-vote/profile`
- Preferences: `{origin}/private/quote-vote/preferences`
- Activity ledger: `{origin}/private/quote-vote/activity-ledger`

## Environment Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SOLID_TOKEN_ENCRYPTION_KEY` | Yes | none | 64 hex characters (32 bytes) for AES-256-GCM. Encrypts tokens and PKCE verifiers. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Rotating it invalidates existing connections. |
| `SOLID_CLIENT_ID` | Yes in production | `quotevote-backend` | OAuth client ID. Must match the client identifier registered with the provider. |
| `SOLID_REDIRECT_URI_BASE` | Recommended | falls back to `CLIENT_URL`, then `http://localhost:3000` | Origin of the **frontend** that hosts `/settings/solid/callback`. |
| `CLIENT_URL` | Fallback | none | Used for the redirect URI when `SOLID_REDIRECT_URI_BASE` is unset. |
| `SOLID_DEFAULT_ISSUER` | No | none | Suggested issuer for the UI. The backend does not read it. |
| `SOLID_ACTIVITY_LEDGER_ENABLED` | No | `false` | Enables pulling and appending the activity ledger. |

See `quotevote-backend/.env.example` for a copy-paste template.

## Usage

```graphql
mutation StartConnect { solidStartConnect(issuer: "https://solidcommunity.net") { authorizationUrl } }

mutation FinishConnect {
  solidFinishConnect(code: "code_from_callback", state: "state_from_callback",
                     redirectUri: "https://app.example/settings/solid/callback") {
    success webId issuer message
  }
}

query ConnectionStatus { solidConnectionStatus { connected webId issuer lastSyncAt } }

query PullData { solidPullPortableState { portableSchemaVersion profile { displayName avatarUrl bio } updatedAt } }

mutation PushData { solidPushPortableState(input: { profile: { displayName: "John Doe" } }) }

mutation Disconnect { solidDisconnect }
```

## Security

- AES-256-GCM for tokens and PKCE verifiers. The key comes from the environment only.
- Single-use, 10-minute, user-bound authorization state with PKCE S256 and exact redirect URI matching.
- Every resolver is scoped to `context.userId`. No resolver accepts a user id from the client.
- Errors and logs carry no tokens, codes, verifiers or provider bodies.
- Only `sub`, `webid`, `iss`, `aud` and `exp` are stored from the ID token.

## Limitations

### ID token verification and SSRF guard
The ID token is verified before connecting (`verifyIdToken` in `oidc/security.ts`): RS256/ES256 signature against the issuer's JWKS, plus `iss`, `aud` (client id) and `exp`. Outbound requests to issuer endpoints, JWKS and Pod URLs are checked with `assertPublicUrl`, which rejects non-https URLs and hosts that are or resolve to private, loopback or link-local addresses (loopback is allowed outside production). Residual risk: DNS rebinding between the check and the fetch.

### Provider client registration
Solid-OIDC providers generally require the Client ID to be a **dereferenceable Client ID document** (a URL that describes the client and its redirect URIs). That document is not part of this codebase. It must be hosted and registered before real providers accept `SOLID_CLIENT_ID`.

### End-to-end verification
End-to-end verification against a real Solid provider and Pod is **not** performed in CI. Unit tests cover the OIDC lifecycle with mocked providers, Pod responses and an in-memory Prisma double.

### GraphQL SDL
The live schema in `app/data/type_definition/` still declares `PortableState` and `PortableStateInput` with the legacy `{version, collections}` shape. The resolvers return and accept the portable contract above. `app/data/resolvers/solidTypeDefs.ts` is not wired into the schema. Aligning the live SDL with the portable contract is a follow-up.

## Testing

Unit tests in `__tests__/unit/solid/`:
- `solidResolvers.test.ts`: start and finish lifecycle, state binding, expiry, single use, redirect mismatch, cross-user isolation, error code mapping, and absence of secrets in errors.
- `syncService.test.ts`: pull, push and append against a mocked Pod client and Prisma. Covers merge rules, 404 defaults, transient-failure protection and validation.
- `solidClient.test.ts`: refresh on expiry, retry on 401, `invalid_grant` handling, and timeout mapping.
- `oidc.test.ts`: issuer rules, token endpoint error sanitisation, and ID token parsing.
- `encryption.test.ts`, `schemas.test.ts`: existing helpers.

## Troubleshooting

### Connection fails
1. Verify `SOLID_TOKEN_ENCRYPTION_KEY` is 64 hex characters.
2. Check the issuer URL is reachable over https.
3. Verify the redirect URI registered with the provider matches the frontend callback.
4. `SOLID_UNAVAILABLE` with a `finishConnect` error: check the server logs for the operation name and error kind.

### `BAD_USER_INPUT` on finish
The authorization state is missing, expired (10 minutes), already used, bound to another user, or the redirect URI does not match. Start the connection again.

### `SOLID_REAUTH_REQUIRED`
The provider rejected the refresh token. The user must reconnect.

### Data sync fails
1. Verify the Pod resource URIs are reachable.
2. Check the granted scopes include read and write access to the Quote.Vote resources.
3. Check the Pod storage quota.

## Future Enhancements

- [x] Verify ID token signatures against the issuer JWKS
- [ ] Align the live GraphQL SDL with the portable contract
- [ ] Multiple Pod providers
- [ ] Automatic conflict resolution strategies
- [ ] Pod storage quota monitoring

## References

- [Solid Project](https://solidproject.org/)
- [Solid OIDC Specification](https://solid.github.io/solid-oidc/)
- [Inrupt Solid Client](https://docs.inrupt.com/developer-tools/javascript/client-libraries/)

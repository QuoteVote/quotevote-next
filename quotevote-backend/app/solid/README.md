# Solid Pod Integration

This module implements backend support for Solid Pod integration in Quote.Vote (issue #511): users connect a Solid Pod via Solid-OIDC and sync portable user data with it.

## Overview

Quote.Vote users can:
- Connect a Solid Pod to their account via Solid-OIDC (authorization code flow with PKCE and DPoP)
- Pull and push portable profile/preferences data, and optionally append to an activity ledger
- Keep their data ownership while using Quote.Vote services

## Architecture

```
app/solid/
├── oidc/                 # OpenID Connect
│   ├── discovery.ts      # Issuer discovery, issuer URL validation, JSON-LD issuer extraction
│   ├── authorization.ts  # Authorization URL, code exchange and refresh (DPoP-bound token requests)
│   ├── dpop.ts           # ES256 DPoP key pairs and proofs (RFC 9449)
│   ├── security.ts       # SSRF guard (assertPublicUrl) and ID token verification (verifyIdToken)
│   └── webid.ts          # WebID profile check: the profile must list the token issuer
├── client/
│   └── solidClient.ts    # Authenticated Pod fetch: DPoP requests, refresh-on-expiry, retry on 401
├── storage/
│   └── encryption.ts     # AES-256-GCM helpers for token, PKCE verifier and DPoP key storage
├── sync/
│   └── syncService.ts    # Pull / push / append operations
├── schemas/
│   └── portable.ts       # Portable data contract (schema version 0)
├── errors.ts             # Typed errors mapped to GraphQL codes by the resolvers
└── index.ts              # Module exports

app/data/resolvers/solidResolvers.ts  # GraphQL entry points (scoped to context.userId)
app/data/resolvers/solidTypeDefs.ts   # The only GraphQL SDL for Solid (wired in app/data/type_definition/index.ts)
prisma/schema/solid.prisma            # SolidConnection and SolidAuthState models
```

## Persistence (Prisma)

The runtime uses Prisma (MongoDB provider). Two models live in `prisma/schema/solid.prisma`:

| Model | Collection | Purpose |
| --- | --- | --- |
| `SolidConnection` | `solidconnections` | One connection per user (`userId` unique). Holds `webId`, `issuer`, AES-256-GCM `encryptedTokens`, `scopes`, minimal `idTokenClaims`, `tokenExpiry`, derived `resourceUris`, `lastSyncAt`. Back-relation `User.solidConnection`, cascade delete. |
| `SolidAuthState` | `solidauthstates` | Short-lived OIDC state (`state` unique, `userId`, `issuer`, `redirectUri`, encrypted verifier and DPoP key, `expiresAt`). Rows are single use. |

### Migration / compatibility note

The legacy Mongoose model was registered as `SolidConnection`, so its default collection name was `solidconnections`. The Prisma model maps to the same collection, and the field names are unchanged. **No data migration is required**: existing documents are read directly. Mongoose's `SolidConnection` model and its tests have been removed. The `webId` index is kept (`@@index([webId])`).

Connections made before DPoP was introduced have no DPoP key. They keep working with a Bearer token until the user reconnects.

## OIDC Connection Flow

1. **`solidStartConnect(issuer)`**
   - Validates the issuer (see "Issuer rules" below).
   - Deletes expired `SolidAuthState` rows.
   - Generates `state`, a PKCE verifier and a DPoP key pair (ES256). Stores `{state, userId, issuer, redirectUri, encryptedVerifier, expiresAt: now + 10 min}`. `encryptedVerifier` is AES-256-GCM encrypted and holds `{codeVerifier, dpopPrivateJwk, dpopPublicJwk}`.
   - Requests the scope `openid offline_access webid` and returns the provider `authorizationUrl` (`code_challenge_method=S256`).
   - `redirectUri` is the **frontend** page `${SOLID_REDIRECT_URI_BASE || CLIENT_URL || http://localhost:3000}/settings/solid/callback`.
2. The provider redirects the browser to that frontend page with `code` and `state`. The frontend calls **`solidFinishConnect(code, state, redirectUri)`**.
3. **`solidFinishConnect`**
   - Looks up the state. If it is missing, belongs to another user, has expired, or the `redirectUri` differs, it returns the same generic `BAD_USER_INPUT` error. Unknown and foreign states get the same response, so they cannot be probed.
   - Consumes the row immediately (`deleteMany` with the user id, count must be 1). A state can never be replayed, even after a failed attempt.
   - Exchanges the code with the stored verifier and DPoP key. The token request carries a DPoP proof.
   - **Verifies the ID token** with `verifyIdToken` (RS256/ES256 signature against the issuer JWKS, `iss`, `aud` = client id, `exp`). No claim is used before this check.
   - Takes the WebID from the verified `webid` claim, falling back to `sub`. It must be an **https** URL.
   - **WebID check** (`assertWebIdListsIssuer`): the WebID is dereferenced and its profile must list the token issuer as `solid:oidcIssuer` (see "WebID check" below).
   - Upserts the single `SolidConnection` for the user. A reconnect replaces tokens, scopes and claims, and resets `resourceUris` and `lastSyncAt`.
   - Stores only the claims `sub`, `webid`, `iss`, `aud` and `exp`.
4. **`solidDisconnect`** deletes only the caller's connection and pending states.

### Issuer rules

- `https://` issuers are accepted.
- `http://` is accepted only for `localhost` / `127.0.0.1`, and only when `NODE_ENV !== 'production'`.
- Issuers with credentials or a fragment are rejected.

### WebID check

The ID token proves that the provider authenticated *someone* with a WebID claim. It does not prove that the WebID belongs to the issuer. `assertWebIdListsIssuer` (`oidc/webid.ts`) closes that gap:

- The WebID must be `https:`.
- The document is fetched with `Accept: application/ld+json, application/json, text/turtle`, a 10 second timeout and `redirect: 'error'`.
- The document must list the token issuer as `solid:oidcIssuer` (`http://www.w3.org/ns/solid/terms#oidcIssuer` in full). JSON-LD (compact or full key, `{"@id"}` values, `@graph`) and Turtle (`solid:oidcIssuer <...>`, comma-separated lists) are read.
- Trailing slashes are ignored on both sides.
- A non-https WebID, an unreachable or non-2xx profile, or a profile that does not list the issuer returns `invalid_response`. The client sees the generic `SOLID_UNAVAILABLE`.

Unlike discovery, there is no origin fallback here. A profile that does not name the issuer is rejected.

### Client ID Document

`SOLID_CLIENT_ID` is the **public URL of the Client ID Document**, served by the frontend at `<FRONTEND_URL>/solid/client-id.json`. Solid-OIDC providers fetch this document to learn the client's redirect URIs and grant types. It is JSON-LD with:

- `@context`: `https://www.w3.org/ns/solid/oidc-context.jsonld`
- `client_id`: the same URL as `SOLID_CLIENT_ID`
- `redirect_uris`: `[<FRONTEND_URL>/settings/solid/callback]`
- `grant_types`: `["authorization_code", "refresh_token"]`
- `response_types`: `["code"]`
- `scope`: `"openid offline_access webid"`
- `token_endpoint_auth_method`: `"none"`

The backend has no default client ID. If `SOLID_CLIENT_ID` is unset, or is not an https URL (http is allowed only for localhost outside production), every Solid operation that needs it fails with `SOLID_UNAVAILABLE`. The server logs only the error class (`SolidConfigError`).

### No redirects

Every outbound request in the Solid code uses `redirect: 'error'`: the JWKS fetch, the WebID fetch, OpenID configuration discovery, the token endpoint (code exchange and refresh) and every Pod request. A redirect fails the request instead of being followed. This stops a public host from bouncing a request to an internal address after the SSRF check has passed.

## DPoP

Solid-OIDC requires **DPoP-bound** access tokens. Bearer tokens are not accepted by providers for Solid, and this backend never sends them for a connection made by it.

- Each connection has an ES256 (P-256) key pair, generated at `solidStartConnect`. The private key is stored only inside encrypted blobs (`encryptedVerifier` and then `encryptedTokens`).
- The token endpoint calls (`exchangeCodeForTokens`, `refreshAccessToken`) send a `DPoP` proof (`htm=POST`, `htu` = token endpoint). If the provider answers 400 or 401 with a `DPoP-Nonce` header, the request is repeated **once** with that nonce.
- The stored token set holds `token_type`, `dpop_private_jwk` and `dpop_public_jwk`. Refresh uses the same key, and it is never replaced.
- Pod requests send `Authorization: DPoP <access_token>` and a **fresh proof per request** (`htm` = method, `htu` = URL without query or fragment, `ath` = base64url SHA-256 of the access token). A `DPoP-Nonce` on 400/401 is retried once.
- A connection without a key pair (legacy) falls back to `Authorization: Bearer`. A DPoP-bound token whose key is missing is rejected as `SOLID_REAUTH_REQUIRED`.

## Token lifecycle

- Access tokens are refreshed when they expire within 5 minutes.
- A 401 from the Pod triggers one refresh and one retry.
- The refresh response is merged into the stored tokens. The refresh token, ID token and DPoP key are kept when the provider omits them.
- A rejected refresh (`invalid_grant`), or a missing refresh token, is reported as `SOLID_REAUTH_REQUIRED`. The user must reconnect.

## Sync: Source-of-Truth and Conflict Policy

| Operation | Behaviour |
| --- | --- |
| `solidPullPortableState` (Query) | Reads profile, preferences and (if enabled) the ledger from the Pod and **returns them to the caller**. Nothing is written to Quote.Vote automatically. The client decides what to apply. |
| `solidPushPortableState` | Fields supplied by the member **overwrite the same fields in the Pod**. All other Pod fields are preserved (partial and nested merge). Unknown `theme` / `fontScale` values are rejected before any Pod call. |
| `solidAppendActivityEvent` | Feature-flagged. Appends one event to the Pod ledger. A ledger with an unexpected shape is not overwritten. |
| Civic / governance data | Never synced. It stays **instance-authoritative** (Quote.Vote is the source of truth). |

Missing Pod resources (HTTP 404) fall back to defaults. Any other Pod failure propagates. A transient read error therefore cannot make a push overwrite Pod data with defaults.

## GraphQL schema

`app/data/resolvers/solidTypeDefs.ts` is the single definition of the Solid SDL. It is registered in `app/data/type_definition/index.ts`, and no other file declares a Solid type or field.

| Operation | Kind |
| --- | --- |
| `solidConnectionStatus` | Query |
| `solidPullPortableState` | Query |
| `solidStartConnect(issuer)` | Mutation |
| `solidFinishConnect(code, state, redirectUri)` | Mutation |
| `solidDisconnect` | Mutation |
| `solidPushPortableState(input)` | Mutation |
| `solidAppendActivityEvent(input)` | Mutation |

The portable types (`PortableState`, `PortableProfile`, `PortablePreferences`, `NotificationPreferences`, `AccessibilityPreferences` and their `*Input` counterparts) mirror the contract in `schemas/portable.ts`.

## Errors

Resolvers return `GraphQLError`s with stable `extensions.code` values and generic messages. Messages never contain tokens, codes, verifiers, or provider response bodies. Provider bodies are not read beyond the OAuth `error` field, which is only compared to `invalid_grant`.

| Code | When |
| --- | --- |
| `UNAUTHENTICATED` | No authenticated user. |
| `BAD_USER_INPUT` | Invalid issuer, invalid or expired authorization state, invalid payload, invalid theme value, or no Solid connection. |
| `SOLID_REAUTH_REQUIRED` | Refresh or code exchange rejected (`invalid_grant`), Pod returned 401 after refresh, or a DPoP-bound token without its key. The user must reconnect. |
| `SOLID_UNAVAILABLE` | Pod or provider timeout, network error, 403/5xx, discovery failure, WebID check failure (`invalid_response`), missing or invalid `SOLID_CLIENT_ID` (`SolidConfigError`), or any unexpected internal failure. |

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
| `SOLID_TOKEN_ENCRYPTION_KEY` | Yes | none | 64 hex characters (32 bytes) for AES-256-GCM. Encrypts tokens, PKCE verifiers and DPoP keys. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Rotating it invalidates existing connections. |
| `SOLID_CLIENT_ID` | Yes | none | **Public URL of the Client ID Document**: `<FRONTEND_URL>/solid/client-id.json`. Must be https (http only for localhost outside production). Unset or invalid: Solid operations fail with `SOLID_UNAVAILABLE`. |
| `SOLID_REDIRECT_URI_BASE` | Recommended | falls back to `CLIENT_URL`, then `http://localhost:3000` | Origin of the **frontend** that hosts `/settings/solid/callback`. Must match the `redirect_uris` entry in the Client ID Document. |
| `CLIENT_URL` | Fallback | none | Used for the redirect URI when `SOLID_REDIRECT_URI_BASE` is unset. |
| `SOLID_DEFAULT_ISSUER` | No | none | Suggested issuer for the UI. The backend does not read it. |
| `SOLID_ACTIVITY_LEDGER_ENABLED` | No | `false` | Enables pulling and appending the activity ledger. |

Example Client ID Document for `FRONTEND_URL=https://app.quote.vote`, served at `https://app.quote.vote/solid/client-id.json`:

```json
{
  "@context": ["https://www.w3.org/ns/solid/oidc-context.jsonld"],
  "client_id": "https://app.quote.vote/solid/client-id.json",
  "redirect_uris": ["https://app.quote.vote/settings/solid/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "openid offline_access webid",
  "token_endpoint_auth_method": "none"
}
```

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

- AES-256-GCM for tokens, PKCE verifiers and DPoP private keys. The key comes from the environment only.
- Single-use, 10-minute, user-bound authorization state with PKCE S256 and exact redirect URI matching.
- DPoP-bound tokens: a stolen access token cannot be used without the private key.
- ID token verified (signature, `iss`, `aud`, `exp`) before any claim is used. The WebID must list the issuer.
- SSRF guard (`assertPublicUrl`): https only (http for loopback in development). Blocked ranges are checked with `net.BlockList`:
  - IPv4: `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.0.0/24`, `192.168/16`, `198.18/15`, `224/4`, `240/4`.
  - IPv6: `::/128`, `::1`, `fc00::/7`, `fe80::/10`, `ff00::/8`, `64:ff9b::/96` (NAT64). IPv4-mapped addresses (`::ffff:a.b.c.d` and the hex form `::ffff:xxxx:xxxx`) are checked against the IPv4 ranges.
  - Hostnames are resolved and every returned address is checked.
- No redirects on any outbound request (see "No redirects").
- Every resolver is scoped to `context.userId`. No resolver accepts a user id from the client.
- Errors and logs carry no tokens, codes, verifiers, DPoP keys or provider bodies.
- Only `sub`, `webid`, `iss`, `aud` and `exp` are stored from the ID token.

## Limitations

- **DNS rebinding.** `assertPublicUrl` resolves a host and then fetch resolves it again. A rebinding attack between the two lookups is not blocked.
- **No live provider tests.** End-to-end verification against a real Solid provider and Pod is not run in CI. Unit tests cover the OIDC lifecycle with mocked providers, Pod responses and an in-memory Prisma double.
- **Nonce cache.** A DPoP nonce is requested per Pod request, not cached per connection.
- **Client ID Document.** The document is served by the frontend. The backend only validates the URL it is given.

## Testing

Unit tests in `__tests__/unit/solid/`:
- `solidResolvers.test.ts`: start and finish lifecycle, state binding, expiry, single use, redirect mismatch, cross-user isolation, client ID validation, WebID check, DPoP key binding, error code mapping, and absence of secrets in errors.
- `solidSchema.test.ts`: the Solid documents validate against the real schema (`~/data/schema`) and run end to end with a Prisma stub. Also checks that each Solid type is defined once and that `solidPullPortableState` is a Query.
- `syncService.test.ts`: pull, push and append against a mocked Pod client and Prisma. Covers merge rules, 404 defaults, transient-failure protection and validation.
- `solidClient.test.ts`: refresh on expiry, retry on 401, `invalid_grant` handling, timeout mapping, DPoP request format, nonce retry, refresh with the same key, and the no-redirect policy.
- `oidc.test.ts`: issuer rules, token endpoint error sanitisation, DPoP proof on the token endpoint, nonce retry, and no redirects.
- `security.test.ts`: blocked and allowed IPv4 / IPv6 ranges, IPv4-mapped IPv6 (hex and dotted), NAT64, DNS results, and ID token verification.
- `dpop.test.ts`: key generation, proof signature verification with the embedded public key, `htu` without query, `htm`, `ath`, nonce, and key validation.
- `webid.test.ts`: issuer extraction from JSON-LD and Turtle, list of issuers, trailing slashes, http rejection, fetch options, and failure mapping.
- `encryption.test.ts`, `schemas.test.ts`: existing helpers.

## Troubleshooting

### Connection fails
1. Verify `SOLID_TOKEN_ENCRYPTION_KEY` is 64 hex characters.
2. Verify `SOLID_CLIENT_ID` is set to the public Client ID Document URL, and that the URL serves the document with `client_id` equal to that URL.
3. Check the issuer URL is reachable over https.
4. Verify the redirect URI registered with the provider matches the frontend callback.
5. `SOLID_UNAVAILABLE` with a `finishConnect` error: check the server logs for the operation name and error kind. A WebID that does not list the issuer also shows up here.

### `BAD_USER_INPUT` on finish
The authorization state is missing, expired (10 minutes), already used, bound to another user, or the redirect URI does not match. Start the connection again.

### `SOLID_REAUTH_REQUIRED`
The provider rejected the refresh token, or the token is DPoP-bound and its key is missing. The user must reconnect.

### Data sync fails
1. Verify the Pod resource URIs are reachable.
2. Check the granted scopes include read and write access to the Quote.Vote resources.
3. Check the Pod storage quota.

## Future Enhancements

- [x] Verify ID token signatures against the issuer JWKS
- [x] Align the live GraphQL SDL with the portable contract
- [x] DPoP-bound tokens
- [x] WebID-to-issuer check
- [ ] Multiple Pod providers
- [ ] Automatic conflict resolution strategies
- [ ] Pod storage quota monitoring

## References

- [Solid Project](https://solidproject.org/)
- [Solid OIDC Specification](https://solid.github.io/solid-oidc/)
- [DPoP (RFC 9449)](https://www.rfc-editor.org/rfc/rfc9449)
- [Inrupt Solid Client](https://docs.inrupt.com/developer-tools/javascript/client-libraries/)

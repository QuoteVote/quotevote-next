# Solid Pod Integration

This module implements backend support for Solid Pod integration in Quote.Vote, enabling users to connect their Solid Pods and sync portable user data.

## Overview

The Solid Pod integration allows Quote.Vote users to:
- Connect a Solid Pod to their account via Solid-OIDC
- Store and sync portable user data (profile, preferences, activity ledger)
- Maintain data ownership while using Quote.Vote services

## Architecture

```
app/solid/
├── oidc/              # OpenID Connect authentication
│   ├── discovery.ts   # Issuer discovery
│   └── authorization.ts # Authorization code flow
├── client/            # Solid Pod client
│   └── solidClient.ts # Authenticated fetch wrapper
├── storage/           # Token storage
│   └── encryption.ts  # AES-256-GCM encryption
├── sync/              # Data synchronization
│   └── syncService.ts # Pull/push operations
├── schemas/           # Data schemas
│   └── portable.ts    # Portable data definitions
└── index.ts           # Module exports
```

## Features

### Phase A - Foundations ✅
- ✅ SolidConnection MongoDB model with encrypted token storage
- ✅ AES-256-GCM encryption utilities for token security
- ✅ OIDC issuer discovery module

### Phase B - OIDC Connect Flow ⚠️
- ✅ Authorization URL generation with PKCE
- ✅ Token exchange implementation
- ✅ Token refresh logic
- ⚠️ State management (requires Redis or similar for production)
- ✅ GraphQL mutations: `solidStartConnect`, `solidFinishConnect`, `solidDisconnect`
- ✅ GraphQL query: `solidConnectionStatus`

### Phase C - Pod Read/Write ✅
- ✅ Authenticated Solid client with automatic token refresh
- ✅ Canonical resource path definitions
- ✅ `solidPullPortableState` mutation
- ✅ `solidPushPortableState` mutation

### Phase D - Activity Ledger ✅
- ✅ Event schema and serialization
- ✅ `solidAppendActivityEvent` mutation
- ✅ Feature flag gating (`SOLID_ACTIVITY_LEDGER_ENABLED`)

### Phase E - Tests + Docs 🚧
- 🚧 Unit tests (TODO)
- 🚧 Integration tests (TODO)
- ✅ Documentation (this file)

## Environment Variables

Required environment variables:

```bash
# Encryption key for token storage (32 bytes hex-encoded)
# Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
SOLID_TOKEN_ENCRYPTION_KEY=your-64-character-hex-key

# OAuth Client ID for Solid OIDC
SOLID_CLIENT_ID=quotevote-backend

# Base URL for OAuth redirects
SOLID_REDIRECT_URI_BASE=http://localhost:4000

# Optional: Default issuer for convenience
SOLID_DEFAULT_ISSUER=https://solidcommunity.net

# Feature flag: Enable activity ledger
SOLID_ACTIVITY_LEDGER_ENABLED=false
```

## Usage

### 1. Connect a Solid Pod

```graphql
mutation StartConnect {
  solidStartConnect(issuer: "https://solidcommunity.net") {
    authorizationUrl
  }
}
```

### 2. Complete Connection (after user authorization)

```graphql
mutation FinishConnect {
  solidFinishConnect(
    code: "auth_code_from_callback"
    state: "state_from_start_connect"
    redirectUri: "http://localhost:4000/auth/solid/callback"
  ) {
    success
    webId
    issuer
    message
  }
}
```

### 3. Check Connection Status

```graphql
query ConnectionStatus {
  solidConnectionStatus {
    connected
    webId
    issuer
    lastSyncAt
  }
}
```

### 4. Pull Data from Pod

```graphql
query PullData {
  solidPullPortableState {
    portableSchemaVersion
    profile {
      displayName
      avatarUrl
      bio
    }
    preferences {
      theme
      notifications {
        email
        push
        inApp
      }
      accessibility {
        reduceMotion
        fontScale
      }
    }
    updatedAt
  }
}
```

### 5. Push Data to Pod

```graphql
mutation PushData {
  solidPushPortableState(
    input: {
      profile: {
        displayName: "John Doe"
        bio: "Software developer"
      }
      preferences: {
        theme: "dark"
      }
    }
  )
}
```

### 6. Disconnect Pod

```graphql
mutation Disconnect {
  solidDisconnect
}
```

## Portable Data Contract

### Profile
```typescript
{
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}
```

### Preferences
```typescript
{
  theme: 'system' | 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    fontScale: 'normal' | 'large';
  };
}
```

### Activity Ledger (Optional)
```typescript
{
  events: Array<{
    type: 'PostCreated' | 'QuoteCreated' | 'VoteCast' | 'BookmarkAdded';
    instanceId: string;
    resourceUrl: string;
    timestamp: string; // ISO8601
    payload: object;
  }>;
}
```

## Security

### Token Encryption
- Uses AES-256-GCM authenticated encryption
- Encryption key stored in environment variable
- Tokens never logged or exposed in responses

### Token Refresh
- Automatic token refresh before expiry
- Retry logic for 401 responses
- Secure storage of refresh tokens

### Authorization
- All GraphQL operations require authentication
- Users can only manage their own Solid connections
- Scopes limited to necessary permissions

## Resource URIs

Default Pod resource locations:
- Profile: `{podUrl}/public/quote-vote/profile`
- Preferences: `{podUrl}/private/quote-vote/preferences`
- Activity Ledger: `{podUrl}/private/quote-vote/activity-ledger`

## Known Limitations

### State Management (TODO)
The `solidFinishConnect` mutation currently requires implementation of secure state storage for:
- PKCE code verifier
- Issuer URL
- CSRF state token

**Recommended Solution**: Use Redis with short TTL (5 minutes) to store state data keyed by state parameter.

### Example Implementation:
```typescript
// In solidStartConnect
await redis.setex(
  `solid:state:${state}`,
  300, // 5 minutes
  JSON.stringify({ codeVerifier, issuer })
);

// In solidFinishConnect
const stateData = await redis.get(`solid:state:${args.state}`);
if (!stateData) {
  throw new Error('Invalid or expired state');
}
const { codeVerifier, issuer } = JSON.parse(stateData);
await redis.del(`solid:state:${args.state}`);
```

## Testing

### Unit Tests (TODO)
- Token encryption/decryption
- Issuer discovery parsing
- Portable state mapping
- Token refresh logic

### Integration Tests (TODO)
- Mock Solid Pod server
- End-to-end connect → pull → push flow
- Failure modes:
  - Expired token refresh
  - Revoked access
  - Issuer discovery failure
  - Permission denied

### Security Tests (TODO)
- Ensure logs contain no tokens/codes
- Ensure user A cannot access user B's connection

## Troubleshooting

### Connection Fails
1. Verify `SOLID_TOKEN_ENCRYPTION_KEY` is set and valid
2. Check issuer URL is accessible
3. Verify redirect URI matches OAuth configuration

### Token Refresh Fails
1. Check if refresh token is still valid
2. Verify issuer's token endpoint is accessible
3. Check if user revoked access

### Data Sync Fails
1. Verify Pod resource URIs are accessible
2. Check token scopes include necessary permissions
3. Verify Pod storage quota not exceeded

## Future Enhancements

- [ ] Implement state management with Redis
- [ ] Add JWT signature verification for ID tokens
- [ ] Support for multiple Pod providers
- [ ] Cross-instance reputation aggregation
- [ ] Client-side Solid access option
- [ ] Automatic conflict resolution strategies
- [ ] Pod storage quota monitoring

## References

- [Solid Project](https://solidproject.org/)
- [Solid OIDC Specification](https://solid.github.io/solid-oidc/)
- [Inrupt Solid Client](https://docs.inrupt.com/developer-tools/javascript/client-libraries/)

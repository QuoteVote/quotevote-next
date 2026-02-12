# Quote.Vote Solid Pods Integration Architecture

**Document Version:** 1.0  
**Date:** February 13, 2026  
**Prepared for:** Jesse Wright (ODI)  
**Prepared by:** Om Kawale (@Om7035) & Quote.Vote Team  
**Related:** PR #279, Discussion #281

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Solid PR Implementation (PR #279)](#solid-pr-implementation-pr-279)
4. [Ideal Solid End State](#ideal-solid-end-state)
5. [Key Questions for Jesse](#key-questions-for-jesse)
6. [Technical Specifications](#technical-specifications)
7. [Next Steps](#next-steps)

---

## Executive Summary

Quote.Vote is a **forkable, community-governed deliberation platform** designed to enable civic discourse across multiple independent instances. We're exploring Solid Pods to enable:

1. **User-owned identity** that travels across Quote.Vote instances
2. **Portable data wallet** for user-controlled exports and preferences
3. **Cross-instance continuity** while maintaining local governance

This document outlines our current architecture, the initial Solid implementation (PR #279), and our vision for the ideal end state.

---

## 1. Current Architecture

### 1.1 Identity & Authentication Model

**Current System:** Traditional centralized authentication per instance

```typescript
// User Model (app/types/common.ts)
interface User {
  _id: string              // MongoDB ObjectId
  username: string         // Unique per instance
  email: string           // Email-based identity
  password?: string       // Hashed password
  avatar?: string         // Avatar URL
  
  // Social features
  _followingId?: string[]
  _followersId?: string[]
  
  // Reputation & moderation
  upvotes?: number
  downvotes?: number
  accountStatus?: AccountStatus  // 'active' | 'disabled'
  botReports?: number
  reputation?: Reputation
  
  // Metadata
  joined?: Date
  createdAt?: Date
  updatedAt?: Date
}
```

**Key Characteristics:**
- ✅ **Instance-scoped identity**: Each instance has its own user database
- ✅ **Email + password authentication**: Traditional auth flow
- ❌ **No cross-instance identity**: Users must create separate accounts per instance
- ❌ **No data portability**: User data is locked to each instance
- ❌ **Instance-dependent**: If an instance shuts down, user data is lost

### 1.2 Storage Model

**Current System:** MongoDB-based centralized storage

**Core Data Entities:**

```typescript
// Posts (Proposals)
interface Post {
  _id: string
  userId: string          // Creator
  groupId?: string        // Optional group context
  title?: string
  text?: string
  url?: string
  citationUrl?: string
  upvotes?: number
  downvotes?: number
  enable_voting?: boolean
  created: Date
}

// Votes
interface Vote {
  _id: string
  userId: string          // Voter
  postId: string          // Post being voted on
  type: VoteType          // 'up' | 'down'
  startWordIndex?: number // For inline voting
  endWordIndex?: number
  tags?: string[]
  content?: string        // Optional vote comment
  created: Date
}

// Comments
interface Comment {
  _id: string
  userId: string
  postId: string
  content: string
  startWordIndex?: number // For inline comments
  endWordIndex?: number
  url?: string
  reaction?: string
  created: Date
}
```

**Storage Characteristics:**
- ✅ **Centralized per instance**: All data in instance MongoDB
- ✅ **Relational integrity**: Foreign keys via `userId`, `postId`
- ✅ **Instance governance**: Instance admins control all data
- ❌ **No user custody**: Users cannot export or control their data
- ❌ **No cross-instance visibility**: Data is siloed per instance

### 1.3 Current Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Quote.Vote Instance                       │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Frontend   │─────▶│   GraphQL    │                    │
│  │  (Next.js)   │◀─────│   API        │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                               │                              │
│                               ▼                              │
│                        ┌──────────────┐                     │
│                        │   MongoDB    │                     │
│                        │              │                     │
│                        │  - Users     │                     │
│                        │  - Posts     │                     │
│                        │  - Votes     │                     │
│                        │  - Comments  │                     │
│                        └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘

User creates account → Data stored in instance DB → User locked to instance
```

### 1.4 Current Limitations

**For Users:**
1. **Identity Fragmentation**: Must create separate accounts for each instance (workplace, city, school, etc.)
2. **No Data Portability**: Cannot export or move their data
3. **Instance Dependency**: If instance shuts down, data is lost
4. **No Cross-Instance Continuity**: Reputation and history don't travel

**For Instance Operators:**
1. **Data Custody Burden**: Responsible for all user data (GDPR, retention, backups)
2. **Legal Liability**: Must handle subpoenas, takedown requests, data breaches
3. **Isolated Communities**: No way to federate or share data across instances

---

## 2. Solid PR Implementation (PR #279)

### 2.1 What Was Implemented

PR #279 implemented **Phase 1: Foundations** for Solid Pod integration:

#### Phase A: Foundations ✅

```typescript
// MongoDB Model for Solid Connection
interface SolidConnection {
  _id: string
  userId: string              // Quote.Vote user ID
  issuer: string             // Solid Pod provider URL
  webId: string              // User's WebID
  encryptedAccessToken: string
  encryptedRefreshToken: string
  encryptedIdToken: string
  tokenExpiresAt: Date
  connected: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Key Components:**
- ✅ AES-256-GCM encryption for OAuth tokens
- ✅ OIDC issuer discovery module
- ✅ Secure token storage in MongoDB

#### Phase B: OIDC Connect Flow ⚠️ (Partially Complete)

**GraphQL Mutations:**
```graphql
type Mutation {
  # Start Solid Pod connection
  solidStartConnect(issuer: String!): SolidAuthUrl!
  
  # Complete connection (INCOMPLETE - requires state management)
  solidFinishConnect(code: String!, state: String!): SolidConnection!
  
  # Disconnect Solid Pod
  solidDisconnect: Boolean!
}

type Query {
  # Check connection status
  solidConnectionStatus: SolidConnection
}
```

**Issues:**
- ❌ Custom OIDC implementation (should use `@inrupt/solid-client-authn-node`)
- ❌ No state management (Redis required for PKCE/CSRF protection)
- ❌ `solidFinishConnect` throws error - not functional
- ❌ GraphQL resolvers not integrated into Apollo Server

#### Phase C: Pod Read/Write ✅

```typescript
// Canonical resource paths in user's Pod
const SOLID_RESOURCES = {
  profile: '/quotevote/profile.ttl',
  preferences: '/quotevote/preferences.json',
  activityLedger: '/quotevote/activity.jsonld'
}

// Mutations
solidPullPortableState(): PortableState
solidPushPortableState(state: PortableStateInput): Boolean
```

**Implemented:**
- ✅ Authenticated Solid client with token refresh
- ✅ Resource path definitions
- ✅ Pull/push operations

**Issues:**
- ❌ No RDF dataset parsing (assumes JSON structure)
- ❌ No validation of Pod data
- ❌ No standard vocabulary usage (FOAF, vCard, etc.)

#### Phase D: Activity Ledger ✅

```typescript
// Activity event schema
interface ActivityEvent {
  type: string              // 'VOTED', 'POSTED', 'COMMENTED'
  timestamp: Date
  instanceUrl: string       // Which instance
  payload: Record<string, unknown>
}

// Mutation
solidAppendActivityEvent(event: ActivityEventInput): Boolean
```

**Implemented:**
- ✅ Event serialization
- ✅ Feature flag gating (`SOLID_ACTIVITY_LEDGER_ENABLED`)

**Issues:**
- ❌ No standard Activity Streams vocabulary
- ❌ Payload is unstructured JSON

### 2.2 Current PR Status

**Overall Status:** ⚠️ **Partially Implemented - Not Production Ready**

**Critical Gaps:**
1. ❌ GraphQL resolvers not integrated (feature is non-functional)
2. ❌ OIDC flow incomplete (users cannot connect)
3. ❌ Custom OIDC implementation (security risk)
4. ❌ No state management (CSRF vulnerability)
5. ❌ No RDF parsing (fragile data handling)
6. ❌ No standard vocabularies (interoperability issues)

**See:** [Responses to jeswr Comments](./Responses_to_jeswr_Comments.md) for detailed feedback and action items.

---

## 3. Ideal Solid End State

### 3.1 Vision: "Unified Wallet Across Forks"

**Goal:** Enable users to participate in multiple Quote.Vote instances while maintaining a unified, user-controlled identity and data wallet.

**Example User Journey:**

```
Alice has a Solid Pod at: https://alice.solidcommunity.net/

Alice participates in:
1. quote.vote (public sandbox)
2. city.example.com/quotevote (local government)
3. company.example.com/quotevote (workplace)
4. school.example.com/quotevote (university)

Her Pod contains:
- Portable identity (WebID, profile, avatar)
- Preferences (notification settings, UI preferences)
- Cross-instance activity index
- User-owned exports of her votes, posts, comments
```

### 3.2 Data Ownership Matrix

#### Instance-Owned Data (Local Governance Truth)

**Stored in:** Instance MongoDB  
**Controlled by:** Instance administrators  
**Reason:** Required for governance, moderation, and community integrity

```typescript
// Instance-owned data
interface InstanceData {
  // Posts submitted to this instance
  posts: Post[]
  
  // Votes cast on this instance's posts
  votes: Vote[]
  
  // Comments on this instance's posts
  comments: Comment[]
  
  // Moderation actions
  moderationActions: {
    reports: UserReport[]
    bans: Ban[]
    contentRemovals: ContentRemoval[]
  }
  
  // Local reputation
  localReputation: {
    score: number
    trustNetwork: string[]  // Local trust graph
  }
  
  // Audit logs (required for governance)
  auditLogs: AuditLog[]
}
```

**Why Instance-Owned:**
- ✅ **Governance**: Instance needs to enforce rules
- ✅ **Moderation**: Must track reports, bans, removals
- ✅ **Integrity**: Prevents vote manipulation across instances
- ✅ **Legal Compliance**: Subpoenas, retention requirements

#### User-Owned Data (User Custody)

**Stored in:** User's Solid Pod  
**Controlled by:** User  
**Reason:** Portable, user-controlled, cross-instance continuity

```typescript
// User-owned data in Pod
interface UserPodData {
  // Identity (portable across instances)
  identity: {
    webId: string                    // https://alice.solidcommunity.net/profile/card#me
    name: string
    avatar: string
    bio: string
    publicKey?: string               // For cryptographic verification
  }
  
  // Preferences (portable)
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      frequency: 'realtime' | 'daily' | 'weekly'
    }
    ui: {
      theme: 'light' | 'dark'
      language: string
      timezone: string
    }
    privacy: {
      showActivity: boolean
      allowCrossInstanceIndex: boolean
    }
  }
  
  // Cross-instance directory
  instances: {
    url: string                      // Instance URL
    joined: Date
    role: 'member' | 'moderator' | 'admin'
    localUserId: string              // Instance-specific user ID
    status: 'active' | 'inactive'
  }[]
  
  // User-owned exports (read-only copies)
  exports: {
    votes: VoteExport[]              // My votes across all instances
    posts: PostExport[]              // My posts across all instances
    comments: CommentExport[]        // My comments across all instances
  }
  
  // Activity ledger (optional)
  activityLedger?: {
    events: ActivityEvent[]          // Cross-instance activity log
  }
}
```

**Why User-Owned:**
- ✅ **Portability**: User can move between instances
- ✅ **Privacy**: User controls who sees their data
- ✅ **Continuity**: Identity persists across instances
- ✅ **Agency**: User can export, delete, or revoke access

### 3.3 Proposed Resource Layout in Pod

**Pod Structure:**

```
https://alice.solidcommunity.net/
├── profile/
│   └── card#me                          # WebID (FOAF)
│
├── quotevote/
│   ├── identity.ttl                     # Portable identity (FOAF, vCard)
│   ├── preferences.jsonld               # User preferences
│   ├── instances.jsonld                 # Cross-instance directory
│   │
│   ├── exports/                         # User-owned exports
│   │   ├── votes.jsonld                 # All my votes
│   │   ├── posts.jsonld                 # All my posts
│   │   └── comments.jsonld              # All my comments
│   │
│   └── activity/                        # Activity ledger (optional)
│       └── ledger.jsonld                # Activity Streams 2.0
│
└── public/
    └── avatar.png                       # Public avatar
```

**Vocabularies:**
- **Identity**: FOAF (Friend of a Friend), vCard
- **Activity**: Activity Streams 2.0
- **Preferences**: Custom vocabulary (to be defined)
- **Exports**: Custom vocabulary based on Quote.Vote schema

### 3.4 Ideal Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Solid Pod                             │
│                  https://alice.solidcommunity.net/                   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Identity   │  │ Preferences  │  │   Exports    │             │
│  │   (FOAF)     │  │   (JSON-LD)  │  │   (JSON-LD)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │         Cross-Instance Directory (instances.jsonld)       │      │
│  │  - quote.vote                                             │      │
│  │  - city.example.com/quotevote                            │      │
│  │  - company.example.com/quotevote                         │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Solid-OIDC
                              │ (read/write with user permission)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Instance 1   │     │  Instance 2   │     │  Instance 3   │
│  quote.vote   │     │ city.example  │     │company.example│
│               │     │               │     │               │
│  MongoDB:     │     │  MongoDB:     │     │  MongoDB:     │
│  - Posts      │     │  - Posts      │     │  - Posts      │
│  - Votes      │     │  - Votes      │     │  - Votes      │
│  - Comments   │     │  - Comments   │     │  - Comments   │
│  - Moderation │     │  - Moderation │     │  - Moderation │
└───────────────┘     └───────────────┘     └───────────────┘

Flow:
1. User authenticates with Solid-OIDC (WebID)
2. Instance reads identity + preferences from Pod
3. User creates post/vote/comment → stored in instance MongoDB
4. Instance writes export copy to user's Pod (with permission)
5. User can revoke access at any time
```

### 3.5 Proposed Permission Model

**Safe-by-Default Permissions:**

```turtle
# In user's Pod: quotevote/.acl

# Public read for identity
<#PublicIdentity>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <identity.ttl>;
    acl:mode acl:Read.

# Instance-specific write permissions (granted per instance)
<#InstanceWrite>
    a acl:Authorization;
    acl:agent <https://quote.vote/app#agent>;
    acl:accessTo <exports/>, <activity/>;
    acl:mode acl:Read, acl:Write, acl:Append.

# User full control
<#OwnerControl>
    a acl:Authorization;
    acl:agent <https://alice.solidcommunity.net/profile/card#me>;
    acl:accessTo <./>;
    acl:mode acl:Read, acl:Write, acl:Control.
```

**Permission Principles:**
1. **Public Identity**: Avatar, name, bio (user chooses)
2. **Instance-Specific Grants**: User explicitly grants each instance access
3. **Append-Only for Exports**: Instances can append to exports, not modify
4. **User Full Control**: User can revoke access anytime
5. **No Cross-Instance Leakage**: Instance A cannot read Instance B's data

---

## 4. Key Questions for Jesse

### 4.1 WebID / Solid-OIDC Approach

**Context:** Quote.Vote is designed to be **forkable and invite-only** (not fully public).

**Questions:**

1. **WebID as Primary Identity:**
   - Should we use WebID as the **primary identity** for users, or as a **secondary/linked identity**?
   - If primary: How do we handle users who don't have a Solid Pod yet?
   - If secondary: How do we link existing Quote.Vote accounts to WebIDs?

2. **Invite-Only + Solid:**
   - Quote.Vote instances are invite-only (anti-spam, trust networks)
   - How do we reconcile "anyone with a WebID can authenticate" with "invite-only"?
   - Proposed: WebID for authentication, but instance still controls membership via invites?

3. **OIDC Library Choice:**
   - For **backend (Node.js)**: Is `@inrupt/solid-client-authn-node` the recommended library?
   - For **frontend (Next.js)**: Should we use `@inrupt/solid-client-authn-browser` or `solid-oidc-client-browser`?
   - Any gotchas or best practices for server-side OIDC in a multi-instance context?

4. **Session Management:**
   - Should we store Solid sessions server-side (Redis) or client-side (browser)?
   - How do we handle token refresh across multiple instances?

### 4.2 Resource Layout Pattern

**Context:** We want proposals in author's Pod, votes/comments in each participant's Pod.

**Proposed Pattern:**

```
Proposal Flow:
1. Alice creates a proposal on city.example.com/quotevote
2. Proposal stored in:
   - Instance DB: city.example.com MongoDB (governance truth)
   - Alice's Pod: alice.pod/quotevote/exports/posts/post-123.jsonld (user export)

Vote Flow:
1. Bob votes on Alice's proposal
2. Vote stored in:
   - Instance DB: city.example.com MongoDB (governance truth)
   - Bob's Pod: bob.pod/quotevote/exports/votes/vote-456.jsonld (user export)

Comment Flow:
1. Carol comments on Alice's proposal
2. Comment stored in:
   - Instance DB: city.example.com MongoDB (governance truth)
   - Carol's Pod: carol.pod/quotevote/exports/comments/comment-789.jsonld (user export)
```

**Questions:**

1. **Is this the right pattern?**
   - Should proposals live **only** in author's Pod, or also in instance DB?
   - Our current thinking: **Both** (instance DB for governance, Pod for user custody)

2. **Resource URIs:**
   - Should we use instance-scoped URIs (`https://city.example.com/posts/123`) or Pod-scoped URIs (`https://alice.pod/quotevote/exports/posts/post-123`)?
   - How do we handle cross-instance references (Bob on instance A votes on Alice's post from instance B)?

3. **Linked Data:**
   - Should votes/comments **link** to the proposal in the author's Pod?
   - Example: Bob's vote contains `<proposal> <https://alice.pod/quotevote/exports/posts/post-123>`?
   - How do we handle access control (Bob can vote even if he can't read Alice's Pod)?

4. **Synchronization:**
   - If the instance DB is the "source of truth", how often should we sync to Pods?
   - Real-time (on every action) or batch (nightly export)?
   - What happens if Pod write fails (user revoked access)?

### 4.3 Permission Model

**Questions:**

1. **Safe-by-Default:**
   - What's the recommended default permission model for Quote.Vote data?
   - Should exports be public, private, or instance-specific?

2. **Sharing a Proposal:**
   - Alice creates a proposal and wants feedback from Bob, Carol, David
   - Should Alice explicitly grant read access to each person?
   - Or should the instance act as a "proxy" (instance reads Alice's Pod, serves to others)?

3. **Collecting Feedback:**
   - When Bob votes, should his vote be:
     - **Public** (anyone can see)?
     - **Instance-visible** (only city.example.com can see)?
     - **Private** (only Bob can see)?
   - How do we balance transparency (public votes) with privacy (user control)?

4. **Revocation:**
   - If Alice revokes access to her Pod, what happens to:
     - Her existing proposals on the instance?
     - Votes/comments on her proposals?
   - Proposed: Instance keeps a cached copy for governance, but stops syncing new data?

### 4.4 Technical Implementation

**Questions:**

1. **RDF vs JSON-LD:**
   - Should we use Turtle (.ttl) or JSON-LD (.jsonld) for Pod data?
   - Our preference: JSON-LD (easier for developers), but open to Turtle if better for interop

2. **Vocabularies:**
   - For identity: FOAF + vCard?
   - For activity: Activity Streams 2.0?
   - For votes/posts/comments: Custom vocabulary or existing standard?
   - Should we publish our vocabulary as a formal spec?

3. **Data Validation:**
   - How do we validate data read from Pods?
   - Use Shape Expressions (ShEx) or SHACL?
   - Any recommended libraries for validation in Node.js?

4. **Caching Strategy:**
   - Should we cache Pod data in instance DB (for performance)?
   - How do we handle stale data (user updates Pod, instance cache is outdated)?
   - Recommended TTL for cached data?

5. **Error Handling:**
   - What happens if:
     - User's Pod is offline?
     - User's Pod provider shuts down?
     - User deletes their Pod?
   - Should we have a "fallback mode" (instance-only, no Pod)?

---

## 5. Technical Specifications

### 5.1 Current Tech Stack

**Backend:**
- **Runtime**: Node.js 20.x
- **Framework**: Express 5.2.1
- **Language**: TypeScript 5.9.3 (strict mode)
- **GraphQL**: Apollo Server (v3/v4)
- **Database**: MongoDB with Mongoose
- **Package Manager**: pnpm

**Frontend:**
- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript
- **UI**: React 18.x

### 5.2 Proposed Solid Stack

**Backend:**
```json
{
  "dependencies": {
    "@inrupt/solid-client-authn-node": "^3.1.1",
    "@inrupt/solid-client": "^2.x",
    "@inrupt/vocab-common-rdf": "^1.x",
    "jsonld": "^8.x",
    "n3": "^1.x"  // For Turtle parsing
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "@inrupt/solid-client-authn-browser": "^2.x",
    "@inrupt/solid-client": "^2.x",
    "@inrupt/solid-ui-react": "^3.x"
  }
}
```

### 5.3 Environment Variables

```env
# Solid Configuration
SOLID_CLIENT_ID=https://quote.vote/app
SOLID_CLIENT_SECRET=<secret>
SOLID_REDIRECT_URI=https://quote.vote/solid/callback

# State Management (Redis)
REDIS_URL=redis://localhost:6379

# Feature Flags
SOLID_ENABLED=true
SOLID_ACTIVITY_LEDGER_ENABLED=false  # Phase 2
```

### 5.4 GraphQL Schema (Proposed)

```graphql
# Solid Pod Connection
type SolidConnection {
  id: ID!
  webId: String!
  issuer: String!
  connected: Boolean!
  connectedAt: DateTime
}

# Portable Identity
type PortableIdentity {
  webId: String!
  name: String
  avatar: String
  bio: String
}

# Mutations
type Mutation {
  # Connect Solid Pod
  solidConnect(issuer: String!): SolidAuthUrl!
  solidCallback(code: String!, state: String!): SolidConnection!
  solidDisconnect: Boolean!
  
  # Sync data to Pod
  syncIdentityToPod(identity: PortableIdentityInput!): Boolean!
  syncPreferencesToPod(preferences: PreferencesInput!): Boolean!
  exportActivityToPod: Boolean!
}

# Queries
type Query {
  # Connection status
  solidConnection: SolidConnection
  
  # Read from Pod
  identityFromPod: PortableIdentity
  preferencesFromPod: Preferences
}
```

---

## 6. Next Steps

### 6.1 Immediate Actions (Based on Jesse's Feedback)

1. **Refactor OIDC Implementation**
   - Replace custom OIDC with `@inrupt/solid-client-authn-node`
   - Implement Redis-based state management
   - Add proper JWT signature verification

2. **Implement RDF Parsing**
   - Use `@inrupt/solid-client` for all Pod operations
   - Add proper dataset parsing (no JSON assumptions)
   - Implement standard vocabularies (FOAF, vCard, Activity Streams)

3. **Integrate GraphQL Resolvers**
   - Add Solid resolvers to Apollo Server
   - Complete `solidFinishConnect` implementation
   - Add integration tests

### 6.2 Questions for Jesse (Priority Order)

**High Priority:**
1. WebID as primary vs. secondary identity?
2. Recommended OIDC library for backend (Node.js)?
3. Resource layout pattern (proposal in author Pod + instance DB)?
4. Permission model for invite-only instances?

**Medium Priority:**
5. RDF format preference (Turtle vs JSON-LD)?
6. Vocabulary recommendations (custom vs. standard)?
7. Caching strategy for Pod data?
8. Error handling for offline Pods?

**Low Priority:**
9. Data validation approach (ShEx vs. SHACL)?
10. Cross-instance reference URIs?

### 6.3 Proposed Timeline

**Phase 1: Foundations (Current)**
- ✅ Basic OIDC connection (needs refactoring)
- ✅ Token storage and encryption
- ⏳ Awaiting Jesse's feedback

**Phase 2: Core Integration (After Feedback)**
- Refactor OIDC with Inrupt libraries
- Implement proper RDF parsing
- Define vocabularies and schemas
- Implement permission model

**Phase 3: User-Facing Features**
- Identity sync (WebID → Quote.Vote)
- Preferences sync (Pod ↔ Instance)
- Export functionality (Instance → Pod)

**Phase 4: Advanced Features**
- Cross-instance directory
- Activity ledger
- Federated search (optional)

---

## 7. Appendices

### Appendix A: Related Resources

- **PR #279**: https://github.com/QuoteVote/quotevote-next/pull/279
- **Discussion #281**: https://github.com/QuoteVote/quotevote-next/discussions/281
- **Responses to jeswr**: [Responses_to_jeswr_Comments.md](./Responses_to_jeswr_Comments.md)
- **Quote.Vote Repo**: https://github.com/QuoteVote/quotevote-next

### Appendix B: Glossary

- **WebID**: A URI that identifies a person (e.g., `https://alice.solidcommunity.net/profile/card#me`)
- **Solid Pod**: Personal Online Datastore - user-controlled storage
- **OIDC**: OpenID Connect - authentication protocol
- **FOAF**: Friend of a Friend - RDF vocabulary for people
- **Activity Streams**: W3C standard for social activity data
- **Turtle**: RDF serialization format (.ttl)
- **JSON-LD**: JSON-based RDF serialization format

### Appendix C: Contact Information

**Quote.Vote Team:**
- **Om Kawale** (@Om7035) - Lead Developer, Solid Integration
- **@flyblackbox** - Founder, Product Vision

**Solid Expert:**
- **Jesse Wright** (ODI) - Solid Advisor

---

**Document Status:** Draft v1.0 - Awaiting feedback from Jesse Wright

**Last Updated:** February 13, 2026


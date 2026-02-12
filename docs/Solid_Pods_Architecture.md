# Quote.Vote Solid Pods Integration Architecture

**Document Version:** 2.0  
**Date:** February 13, 2026  
**Prepared for:** Jesse Wright (ODI)  
**Prepared by:** Om Kawale (@Om7035) & Quote.Vote Team  
**Related:** PR #279, Discussion #281

---

## Executive Summary for Experts

**What Quote.Vote Is:** A forkable, community-governed deliberation platform for civic discourse. Think "GitHub for civic decisions" - instances can be forked for different communities (workplace, city, school) while maintaining local governance.

**Why Solid:** We need user-owned identity and data portability across Quote.Vote instances. When someone participates in 5 different Quote.Vote communities, they shouldn't need 5 separate identities or lose their data if an instance shuts down.

**Current State:** Traditional centralized auth (email/password) with MongoDB per instance. Users are locked to each instance.

**What We Built (PR #279):** Basic Solid Pod connection with custom OIDC, token storage, and Pod read/write. **Status:** Partially working but has critical gaps (see your feedback).

**Core Challenge:** How to balance:
- **Instance governance** (moderation, voting integrity, legal compliance) 
- **User data ownership** (portability, privacy, agency)
- **Invite-only model** (trust networks, anti-spam) with Solid's open authentication

**What We Need:** Guidance on 3 key architectural decisions (detailed in Section 5).

**Time Ask:** 30-minute call or written feedback on the 3 key questions below.

---

## Table of Contents

1. [Why Quote.Vote + Solid](#1-why-quotevote--solid)
2. [Current Architecture](#2-current-architecture)
3. [PR #279: What We Built & What's Broken](#3-pr-279-what-we-built--whats-broken)
4. [Proposed Architecture](#4-proposed-architecture)
5. [3 Key Questions for Jesse](#5-three-key-questions-for-jesse)
6. [Technical Specifications](#6-technical-specifications)
7. [Next Steps](#7-next-steps)

---

## 1. Why Quote.Vote + Solid

### 1.1 The Quote.Vote Vision

Quote.Vote is **civic infrastructure for deliberation**:
- Communities propose ideas, vote, and build consensus
- **Forkable by design**: Any community can run their own instance
- **Invite-only**: Trust networks prevent spam and maintain quality
- **Governance-focused**: Moderation, transparency, and accountability matter

**Real-world use cases:**
- City council uses Quote.Vote for participatory budgeting
- Company uses it for internal decision-making
- University uses it for student governance
- Nonprofit uses it for member voting

**The problem:** Alice participates in all 4 instances above. Today, she has:
- 4 separate accounts (identity fragmentation)
- 4 separate data silos (no portability)
- 4 points of failure (if one instance shuts down, her data is lost)

### 1.2 Why Solid (Not Alternatives)

**Why not just "export to JSON"?**
- No standard format for imports across instances
- No identity portability
- No real-time sync of preferences

**Why not ActivityPub?**
- ActivityPub is great for federation (instances talking to each other)
- But we need **user data custody** (user controls their own data)
- Solid provides both identity (WebID) and storage (Pod)

**Why Solid fits Quote.Vote:**
1. **User-owned identity**: WebID travels across instances
2. **User-controlled storage**: Pod holds portable data
3. **Decoupled architecture**: Instances remain independent (forkable)
4. **Civic values alignment**: User agency, transparency, open standards

### 1.3 Success Criteria

**Phase 1 (MVP):**
- User can connect their Solid Pod to any Quote.Vote instance
- User's identity (name, avatar, bio) syncs from Pod
- User can export their activity (votes, posts, comments) to Pod

**Phase 2 (Full Integration):**
- User's preferences (notifications, UI settings) sync across instances
- Cross-instance directory (user sees all their Quote.Vote communities in one place)
- User can revoke instance access to their Pod anytime

**Phase 3 (Advanced):**
- Activity ledger (cross-instance activity log)
- Reputation portability (with anti-gaming measures)
- Federated search (optional)

---

## 2. Current Architecture

### 2.1 Identity Model

**Traditional centralized auth per instance:**

```typescript
interface User {
  _id: string              // MongoDB ObjectId (instance-specific)
  username: string         // Unique per instance
  email: string           
  password?: string        // Hashed
  avatar?: string
  
  // Social graph (instance-specific)
  _followingId?: string[]
  _followersId?: string[]
  
  // Reputation (instance-specific)
  upvotes?: number
  downvotes?: number
  reputation?: Reputation
  accountStatus?: 'active' | 'disabled'
  
  joined?: Date
}
```

**Limitations:**
- ❌ No cross-instance identity
- ❌ No data portability
- ❌ Instance-dependent (data lost if instance shuts down)

### 2.2 Data Model

**Core entities (all in instance MongoDB):**

```typescript
interface Post {
  _id: string
  userId: string          // Creator
  title?: string
  text?: string
  url?: string
  upvotes?: number
  downvotes?: number
  created: Date
}

interface Vote {
  _id: string
  userId: string          // Voter
  postId: string
  type: 'up' | 'down'
  tags?: string[]
  content?: string        // Optional vote comment
  created: Date
}

interface Comment {
  _id: string
  userId: string
  postId: string
  content: string
  created: Date
}
```

**Characteristics:**
- ✅ Instance has full control (governance, moderation)
- ✅ Fast queries (all data local)
- ❌ Users can't export or control their data
- ❌ No cross-instance visibility

### 2.3 Current Data Flow

```
User → Instance Frontend → GraphQL API → MongoDB
                                          ↓
                                    All data locked
                                    to this instance
```

---

## 3. PR #279: What We Built & What's Broken

### 3.1 What We Implemented

**Phase A: Foundations ✅**
- MongoDB model for Solid connections
- AES-256-GCM token encryption
- OIDC issuer discovery

**Phase B: OIDC Flow ⚠️**
- GraphQL mutations: `solidStartConnect`, `solidFinishConnect`, `solidDisconnect`
- **Issues:** Custom OIDC (should use Inrupt library), no state management, `solidFinishConnect` broken

**Phase C: Pod Read/Write ✅**
- Authenticated Solid client
- Pull/push operations
- **Issues:** No RDF parsing, assumes JSON structure

**Phase D: Activity Ledger ✅**
- Event serialization
- **Issues:** No Activity Streams vocabulary

### 3.2 Critical Gaps (From Your Feedback)

Based on @jeswr's review:

1. **❌ Custom OIDC Implementation**
   - **Problem:** Security risk, reinventing the wheel
   - **Fix:** Use `@inrupt/solid-client-authn-node`

2. **❌ No RDF Dataset Parsing**
   - **Problem:** Assumes JSON structure, fragile
   - **Fix:** Use `@inrupt/solid-client` for proper RDF handling

3. **❌ Token Encryption Confusion**
   - **Clarification:** We encrypt OAuth tokens in our DB (security), NOT Pod data (interoperability)
   - Pod data uses standard RDF vocabularies

4. **❌ GraphQL Resolvers Not Integrated**
   - **Problem:** Feature is non-functional
   - **Fix:** Integrate into Apollo Server

**Full analysis:** [Responses to jeswr Comments](./Responses_to_jeswr_Comments.md)

---

## 4. Proposed Architecture

### 4.1 Data Ownership Model

**Key Principle:** Instance owns governance data, user owns personal data.

#### Instance-Owned Data (MongoDB)

**Why:** Governance, moderation, legal compliance, performance

```typescript
// Stored in instance MongoDB
interface InstanceData {
  posts: Post[]                    // All posts on this instance
  votes: Vote[]                    // All votes on this instance
  comments: Comment[]              // All comments
  
  moderationActions: {
    reports: UserReport[]
    bans: Ban[]
    contentRemovals: ContentRemoval[]
  }
  
  localReputation: {
    score: number
    trustNetwork: string[]         // Local trust graph
  }
  
  auditLogs: AuditLog[]           // Required for governance
}
```

**Rationale:**
- **Governance**: Instance must enforce rules
- **Integrity**: Prevents vote manipulation across instances
- **Performance**: Fast queries for ranking, feeds
- **Legal**: Subpoenas, retention, takedowns

#### User-Owned Data (Solid Pod)

**Why:** Portability, privacy, user agency

```typescript
// Stored in user's Pod
interface UserPodData {
  identity: {
    webId: string                  // Portable identity
    name: string
    avatar: string
    bio: string
  }
  
  preferences: {
    notifications: NotificationPrefs
    ui: UIPrefs
    privacy: PrivacyPrefs
  }
  
  instances: {                     // Cross-instance directory
    url: string
    joined: Date
    role: 'member' | 'moderator'
    localUserId: string
  }[]
  
  exports: {                       // User-owned copies
    votes: VoteExport[]
    posts: PostExport[]
    comments: CommentExport[]
  }
}
```

**Rationale:**
- **Portability**: User can move between instances
- **Privacy**: User controls access
- **Continuity**: Identity persists across instances
- **Agency**: User can export, delete, revoke access

### 4.2 Proposed Pod Structure

```
https://alice.solidcommunity.net/
├── profile/
│   └── card#me                          # WebID (standard location)
│
├── quotevote/
│   ├── identity.ttl                     # FOAF + vCard
│   ├── preferences.jsonld               # Custom vocab
│   ├── instances.jsonld                 # Cross-instance directory
│   │
│   └── exports/                         # User-owned copies
│       ├── votes/
│       │   ├── 2026-01-15-vote-123.jsonld
│       │   └── 2026-02-10-vote-456.jsonld
│       ├── posts/
│       └── comments/
│
└── public/
    └── avatar.png
```

**Vocabularies:**
- Identity: FOAF, vCard (standard)
- Activity: Activity Streams 2.0 (standard)
- Preferences: Custom (to be published)
- Exports: Custom based on Quote.Vote schema

### 4.3 Data Flow (Proposed)

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Solid Pod                          │
│                                                              │
│  Identity + Preferences + Cross-Instance Directory + Exports │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Solid-OIDC
                              │ (user grants access per instance)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Instance 1   │     │  Instance 2   │     │  Instance 3   │
│               │     │               │     │               │
│  MongoDB:     │     │  MongoDB:     │     │  MongoDB:     │
│  - Posts      │     │  - Posts      │     │  - Posts      │
│  - Votes      │     │  - Votes      │     │  - Votes      │
│  - Comments   │     │  - Comments   │     │  - Comments   │
│  - Moderation │     │  - Moderation │     │  - Moderation │
│               │     │               │     │               │
│  Cached:      │     │  Cached:      │     │  Cached:      │
│  - Identity   │     │  - Identity   │     │  - Identity   │
│  - Preferences│     │  - Preferences│     │  - Preferences│
└───────────────┘     └───────────────┘     └───────────────┘

Flow:
1. User authenticates with WebID (Solid-OIDC)
2. Instance reads identity + preferences from Pod (cached locally)
3. User creates post/vote/comment → stored in instance MongoDB
4. Instance writes export copy to Pod (async, with permission)
5. User can revoke access anytime (instance keeps cached copy for governance)
```

**Key Design Decision:** Instance MongoDB is source of truth for governance data. Pod is user-owned export/backup.

### 4.4 Permission Model

```turtle
# In user's Pod: quotevote/.acl

# Public identity (user chooses what's public)
<#PublicIdentity>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <identity.ttl>;
    acl:mode acl:Read.

# Instance-specific permissions (user grants per instance)
<#InstanceAccess>
    a acl:Authorization;
    acl:agent <https://city.example.com/quotevote#app>;
    acl:accessTo <exports/>, <preferences.jsonld>;
    acl:mode acl:Read, acl:Append.

# User full control
<#OwnerControl>
    a acl:Authorization;
    acl:agent <https://alice.solidcommunity.net/profile/card#me>;
    acl:accessTo <./>;
    acl:mode acl:Read, acl:Write, acl:Control.
```

**Principles:**
1. User explicitly grants each instance access
2. Instances can append to exports, not modify
3. User can revoke access anytime
4. No cross-instance data leakage

---

## 5. Three Key Questions for Jesse

### Question 1: WebID as Primary vs. Secondary Identity?

**Context:** Quote.Vote instances are invite-only (trust networks, anti-spam).

**Option A: WebID as Primary Identity**
```
User flow:
1. User has WebID (https://alice.pod/profile/card#me)
2. User requests invite to instance
3. Instance admin approves
4. User logs in with WebID
5. Instance creates local user record linked to WebID
```

**Pros:** Clean Solid model, true portability  
**Cons:** Requires all users to have Pods (adoption barrier)

**Option B: WebID as Secondary/Linked Identity**
```
User flow:
1. User creates traditional account (email/password)
2. User optionally connects Solid Pod later
3. Instance links WebID to existing account
```

**Pros:** Gradual adoption, works for non-Pod users  
**Cons:** Dual identity model, more complex

**Our Question:**
- Which approach do you recommend for invite-only instances?
- How do other Solid apps handle invite-only + WebID?
- Can we start with Option B and migrate to Option A later?

### Question 2: Resource Layout & Synchronization Strategy

**Our Proposed Pattern:**

```
When Alice creates a post on city.example.com:
1. Post stored in instance MongoDB (source of truth for governance)
2. Export copy written to alice.pod/quotevote/exports/posts/post-123.jsonld
3. Instance caches Alice's identity from her Pod (TTL: 24 hours)

When Bob votes on Alice's post:
1. Vote stored in instance MongoDB
2. Export copy written to bob.pod/quotevote/exports/votes/vote-456.jsonld
3. Vote references instance URI: https://city.example.com/posts/123
```

**Our Questions:**
- **Is this the right pattern?** (Instance DB as source of truth, Pod as export)
- **Resource URIs:** Should we use instance URIs (`https://city.example.com/posts/123`) or Pod URIs (`https://alice.pod/quotevote/exports/posts/post-123`) as canonical identifiers?
- **Synchronization:** Real-time (on every action) or batch (nightly)? What if Pod write fails?
- **Caching:** Is 24-hour TTL reasonable for identity/preferences? How do we handle stale data?

**Alternative Pattern (Pod as Source of Truth):**
```
Post lives ONLY in alice.pod, instance just caches/displays it
```
**Why we're not proposing this:** Performance (can't query across Pods), governance (can't moderate if user revokes access), legal (can't comply with subpoenas).

**But we're open to your guidance if there's a better approach.**

### Question 3: Invite-Only + Solid Authentication

**The Tension:**

Solid's model: Anyone with a WebID can authenticate  
Quote.Vote's model: Only invited users can participate

**Our Proposed Solution:**

```
1. WebID authentication is separate from instance membership
2. User authenticates with WebID → instance knows who they are
3. Instance checks: "Is this WebID on our invite list?"
4. If yes → grant access
5. If no → show "Request Invite" page
```

**Our Questions:**
- **Is this approach aligned with Solid principles?**
- **Should we use Solid for authentication but maintain our own authorization?**
- **How do we handle the case where:**
  - Alice has WebID `https://alice.pod/profile/card#me`
  - She's invited to 5 instances
  - Each instance has different permissions (member vs. moderator)
  - Should this be in her Pod or in each instance DB?

**Related:** How do we prevent someone from creating a WebID, getting invited to one instance, then using that WebID to spam other instances?

---

## 6. Technical Specifications

### 6.1 Current Stack

**Backend:** Node.js 20.x, Express 5.2, TypeScript 5.9, Apollo Server, MongoDB  
**Frontend:** Next.js 14.x, React 18.x, TypeScript  
**Package Manager:** pnpm

### 6.2 Proposed Solid Stack

**Backend:**
```json
{
  "@inrupt/solid-client-authn-node": "^3.1.1",
  "@inrupt/solid-client": "^2.x",
  "@inrupt/vocab-common-rdf": "^1.x",
  "n3": "^1.x"
}
```

**Frontend:**
```json
{
  "@inrupt/solid-client-authn-browser": "^2.x",
  "@inrupt/solid-client": "^2.x",
  "@inrupt/solid-ui-react": "^3.x"
}
```

### 6.3 Environment Variables

```env
SOLID_CLIENT_ID=https://quote.vote/app
SOLID_CLIENT_SECRET=<secret>
SOLID_REDIRECT_URI=https://quote.vote/solid/callback
REDIS_URL=redis://localhost:6379
SOLID_ENABLED=true
```

### 6.4 GraphQL Schema (Proposed)

```graphql
type Mutation {
  # Connect Solid Pod
  solidConnect(issuer: String!): SolidAuthUrl!
  solidCallback(code: String!, state: String!): SolidConnection!
  solidDisconnect: Boolean!
  
  # Sync to Pod
  syncIdentityToPod: Boolean!
  syncPreferencesToPod: Boolean!
  exportActivityToPod: Boolean!
}

type Query {
  solidConnection: SolidConnection
  identityFromPod: PortableIdentity
  preferencesFromPod: Preferences
}
```

---

## 7. Next Steps

### 7.1 Immediate Actions (Based on Your Feedback)

1. **Refactor OIDC** → Use `@inrupt/solid-client-authn-node`
2. **Implement RDF Parsing** → Use `@inrupt/solid-client` for all Pod operations
3. **Integrate GraphQL Resolvers** → Add to Apollo Server
4. **Add State Management** → Redis for PKCE/CSRF

### 7.2 After Jesse's Feedback

1. Finalize identity model (primary vs. secondary WebID)
2. Implement chosen resource layout pattern
3. Define permission model for invite-only
4. Publish custom vocabularies (preferences, exports)

### 7.3 Timeline

**Phase 1:** Refactor PR #279 (2 weeks)  
**Phase 2:** Identity + preferences sync (3 weeks)  
**Phase 3:** Export functionality (2 weeks)  
**Phase 4:** Cross-instance directory (3 weeks)

---

## Appendices

### A. Why This Matters (User Stories)

**Alice's Story:**
- Works at TechCorp (uses company.example.com/quotevote)
- Lives in Portland (uses portland.gov/quotevote)
- Volunteers at nonprofit (uses nonprofit.org/quotevote)
- Wants ONE identity, ONE place to see all her activity
- If TechCorp shuts down their instance, she doesn't lose her data

**Bob's Story:**
- Participates in university Quote.Vote
- Graduates, university instance shuts down
- With Solid: His votes, posts, comments are in his Pod (preserved)
- Without Solid: Everything is lost

### B. Related Resources

- **PR #279:** https://github.com/QuoteVote/quotevote-next/pull/279
- **Discussion #281:** https://github.com/QuoteVote/quotevote-next/discussions/281
- **Responses to jeswr:** [Link](./Responses_to_jeswr_Comments.md)

### C. Glossary

- **WebID:** URI identifying a person (e.g., `https://alice.pod/profile/card#me`)
- **Solid Pod:** Personal Online Datastore (user-controlled storage)
- **OIDC:** OpenID Connect (authentication protocol)
- **FOAF:** Friend of a Friend (RDF vocabulary for people)
- **Forkable:** Can be copied and run independently

---

**Document Status:** Ready for expert review  
**Last Updated:** February 13, 2026  
**Contact:** Om Kawale (@Om7035), flyblackbox (Founder)

**What We're Asking:** 30-minute call or written feedback on the 3 key questions in Section 5.

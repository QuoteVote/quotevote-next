# Backend architecture

How the 2.0 backend (`quotevote-backend/`) is put together: how a request is handled, how sign-in and staff roles are checked, how live updates reach members, and how the Prisma models map to the existing MongoDB collections. For running it, see the [backend README](../../quotevote-backend/README.md). For deploying it, see [deployment.md](../deployment.md).

## The pieces

| Part            | Where                                                                                            | What it does                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Entry point     | `app/start.ts`                                                                                   | Registers the `~/*` path alias for the compiled code, then loads the server.                                                        |
| Server          | `app/server.ts`                                                                                  | Connects to MongoDB, starts Apollo and the WebSocket server, adds the REST routes and `/health`, and shuts down cleanly on SIGTERM. |
| GraphQL schema  | `app/data/schema.ts`, `app/data/type_definition/`, `app/data/resolvers/`                         | One executable schema for HTTP and WebSocket. `pnpm schema:print` writes it to the frontend's `schema.graphql` snapshot.            |
| Request context | `app/context.ts`                                                                                 | Builds the context every resolver receives: the signed-in member, `prisma`, `pubsub` and a request id.                              |
| Data            | `prisma/schema/*.prisma`, `app/lib/prisma.ts`                                                    | Prisma 6 on MongoDB. Resolvers use `context.prisma`.                                                                                |
| Live updates    | `app/subscriptions.ts`, `app/data/utils/pubsub.ts`, `app/data/resolvers/subscriptionResolver.ts` | GraphQL subscriptions over WebSocket (`graphql-ws`), on the same `/graphql` path.                                                   |
| Instance setup  | `app/setup.ts`                                                                                   | Indexes, the first administrator and starting content for a new instance. See [instance-setup.md](instance-setup.md).               |

Mongoose is still connected at startup. `/health` reads its connection state, and the index steps, the instance setup and Solid still use its models. Every GraphQL resolver reads and writes through Prisma. Removing Mongoose is tracked in #169.

## A GraphQL request over HTTP

1. **The request arrives** at `POST /graphql`. CORS allows only `CLIENT_URL`. Behind a proxy, `TRUST_PROXY` makes `req.ip` the visitor's address, which the per-visitor rate limits on password reset and investor emails use.
2. **The context is built** (`createHttpContext` in `app/context.ts`):
   - The `Authorization: Bearer <token>` header is verified with `JWT_SECRET`.
   - The member is loaded from the database on every request, so a role change or a disabled account takes effect straight away. The token's own claims (such as `admin`) are never trusted.
   - Tokens issued for other purposes (invite signup, password reset, refresh) are refused as sessions.
3. **The login check runs** before any resolver. Every root field needs a signed-in member, except the public ones listed in `app/data/utils/requireAuth.ts`, such as the feed, a post, a profile, the signup and password reset steps, and introspection. Without a member, a protected operation is refused with `UNAUTHENTICATED`. Persisted queries are turned off, so every request carries its query text and gets this check (#586).
4. **The resolver runs** with `context.prisma`. Resolvers check what the login check can't: ownership of the record, room membership, blocks between members, and staff roles.
5. **Errors** come back as GraphQL errors with a code (`BAD_USER_INPUT`, `FORBIDDEN`, `NOT_FOUND`, `TOO_MANY_REQUESTS`, ...). Unexpected errors are reported to error tracking when `SENTRY_DSN` is set. See [error-tracking.md](error-tracking.md).

## Sign-in

- **REST routes:**
  - `POST /auth/login` takes `{ username, password }` and returns `{ accessToken, refreshToken, user }`. The access token lasts 15 minutes, the refresh token 7 days.
  - `POST /auth/refresh` takes `{ refreshToken }` and returns a new access token.
  - `POST /auth/register` always refuses. Accounts are invite-only: request access, approval, then the emailed link sets the password.
- **The frontend** keeps the token and sends it as the `Authorization` header. Its middleware can check the same token before showing member pages when it has the same `JWT_SECRET`.
- **Password reset and invite links** are separate, single-purpose tokens. A reset link only works while the password it was issued for is unchanged.

## Staff roles

Three flags on the member: `admin`, `isModerator` and `isInviteApprover`. Every staff resolver calls `requireRole(context, role)` (`app/data/utils/requireRole.ts`), which checks the member loaded for this request:

- no member: `UNAUTHENTICATED`
- no role: `FORBIDDEN`
- admins pass every check

Staff actions are written to the staff log. See [staff-roles.md](staff-roles.md).

## Live updates

- **Transport:** the WebSocket server shares the HTTP server and the `/graphql` path. A client sends its token in the connection parameters (`authToken`, `authorization` or `token`).
- **Same checks as HTTP:** each operation is parsed, validated and given the same login check (#586). Only subscriptions are accepted over WebSocket. Queries and mutations go over HTTP.
- **Subscriptions:**

| Subscription             | Who may subscribe                                                           | What it delivers                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `message(messageRoomId)` | Members of a direct room. Anyone for a post's discussion, like its history. | New messages in the room                                                                                             |
| `typing(messageRoomId)`  | Same as `message`                                                           | Typing started or stopped in the room                                                                                |
| `notification(userId)`   | Only the member themselves                                                  | Their new notifications                                                                                              |
| `presence(userId?)`      | Any signed-in member                                                        | Status changes. Nothing between members where either blocks the other, and invisible members show as offline (#749). |

- **Publishing:** a mutation saves the record first, then publishes the event (`context.pubsub.publish`). For example, `createMessage` publishes `MESSAGE_CREATED`, and `addNotification` publishes `NOTIFICATION_CREATED`. Each subscription filters the events to its room or member.
- **One process only:** the pubsub is in memory, so an event only reaches members connected to the same backend process. The deploys run one replica. Running more than one needs a shared pubsub.
- **Lifetime:** access is checked when subscribing. A subscription keeps running until the socket closes.

## Data: Prisma on the existing collections

The new backend reads and writes the database the legacy API has been writing to. There is no copy or conversion at the switch. The Prisma models map to the existing collection and field names:

| Model                                                                                                                                                                | Collection                                           | Renamed fields (Prisma name → stored name)                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                                                                                                                                                               | `users`                                              | `password` → `hash_password`, `isAdmin` → `admin`, `followingIds` → `_followingId`, `followerIds` → `_followersId`, `memberOfTags` → `memberOfGroups`, `wallet` → `_wallet`, `votesId` → `_votesId` |
| `Tag`                                                                                                                                                                | `groups`                                             |                                                                                                                                                                                                     |
| `Post`                                                                                                                                                               | `posts`                                              | `tagId` → `groupId`, `enableVoting` → `enable_voting`                                                                                                                                               |
| `Quote`                                                                                                                                                              | `quotes`                                             | `userId` → `quoter`                                                                                                                                                                                 |
| `MessageRoom`                                                                                                                                                        | `messagerooms`                                       | `userIds` → `users`                                                                                                                                                                                 |
| `Message`                                                                                                                                                            | `messages`                                           | `mutationType` → `mutation_type`                                                                                                                                                                    |
| `UserInvite`                                                                                                                                                         | `userinvites`                                        | `invitedById` → `invitedBy`                                                                                                                                                                         |
| `UserReport`                                                                                                                                                         | `userreports`                                        | `reporterId` → `_reporterId`, `reportedUserId` → `_reportedUserId`                                                                                                                                  |
| `BotReport`                                                                                                                                                          | `botreports`                                         | `reporterId` → `_reporterId`, `userId` → `_reportedUserId`                                                                                                                                          |
| `Comment`, `Vote`, `VoteLog`, `Reaction`, `Notification`, `Activity`, `Presence`, `Typing`, `Roster`, `UserReputation`, `Domain`, `Creator`, `Content`, `Collection` | the plural lowercase name (`comments`, `votes`, ...) |                                                                                                                                                                                                     |

These collections are new with 2.0 and have no legacy data: `buddyrelationships` and `userblocks` (they replace `rosters`, #508), `directmessages`, `terms_acceptances` and `staff_actions`.

### Older records

Records the legacy API wrote don't always have every field the schema declares. The code is written for that:

- **Reads select fields explicitly.** Many legacy records have no `createdAt` or `updatedAt`, and Prisma fails a read that returns a required field it can't find.
- **Flags are filtered in code.** `deleted: false` and `not: true` filters drop records where the flag is missing, so deleted posts, comments and messages are filtered after the read instead.
- **Raw reads and writes for legacy shapes.** A few paths use `findRaw` or `$runCommandRaw`, for example votes, whose response can be stored as a string or a list. Raw writes check their result, because they report failures instead of throwing (#747).
- **Multi-document writes use transactions,** so MongoDB must be a replica set, even a single-node one.

### Indexes

- **Never run `prisma db push` on a shared database.** It also changes and drops indexes.
- **Production never builds indexes at startup.** The index steps build them on purpose: `pnpm db:model-indexes` and `pnpm db:unique-indexes`. See [model-indexes.md](model-indexes.md).
- **Development and tests** build them at startup.
- **Before the switch,** `pnpm data:check` checks a database copy. See [data-checks.md](data-checks.md).

## Tests

- **Unit tests:** `__tests__/unit/` run with `pnpm test`.
- **Integration tests:** `__tests__/integration/prisma-*.test.ts` need a real replica set. They run with `pnpm test:prisma`, and CI runs both.
- **Contract check:** `pnpm check:contract` checks every frontend GraphQL document against this schema.
- **More:** see the [testing guide](testing_guide.md).

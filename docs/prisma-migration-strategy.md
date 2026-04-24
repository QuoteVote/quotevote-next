# Prisma Migration & Database Sync Strategy

## TL;DR

**Do not run `prisma migrate dev` on this project.** It does not support MongoDB. Use `pnpm prisma:push` (or `pnpm prisma:sync`) instead.

---

## Why Not `prisma migrate dev`?

Prisma's `migrate dev`, `migrate deploy`, and `migrate reset` commands are **SQL-only**. They generate `.sql` files in `prisma/migrations/` that describe schema diffs — which is meaningless for MongoDB since MongoDB is schemaless at the database level.

Running `prisma migrate dev` against a MongoDB datasource fails with:

```
Error: Prisma migrate does not support MongoDB.
```

The ticket text (7.27) references `prisma migrate dev --name init`, but the correct MongoDB equivalent is `prisma db push`.

## The MongoDB Sync Workflow

### Everyday flow (schema change → live DB)

1. Edit schema files in `prisma/schema/*.prisma`
2. Validate syntax:
   ```bash
   pnpm prisma:validate
   ```
3. Push schema to the live MongoDB (creates/updates indexes, syncs metadata):
   ```bash
   pnpm prisma:push
   ```
4. Regenerate Prisma Client so TypeScript sees the new types:
   ```bash
   pnpm prisma:generate
   ```

Or run the combined command:

```bash
pnpm prisma:sync   # = prisma:push && prisma:generate
```

### What `db push` actually does

- Syncs the Prisma schema metadata with the connected MongoDB database
- Creates any missing indexes defined in `@@index` / `@@unique`
- **Does NOT** create migration history files — MongoDB is authoritative for data, Prisma only tracks schema shape
- Is **idempotent** — safe to run repeatedly
- Does **NOT** drop data unless `--accept-data-loss` is explicitly passed

## Relationship to Mongoose

Both Mongoose (primary ORM) and Prisma (migration target) read and write the same MongoDB collections. Field-name mismatches between the two ORMs are bridged with `@map()` directives on the Prisma schema (see `docs/prisma-relation-design.md`).

Because MongoDB is schemaless, **old documents written before a new field was added will simply not have that field** — they'll surface as `null` / `undefined` on read. This is acceptable for optional fields and `@default(now())` fields (which only apply on new inserts). For required fields added later, a backfill script is needed (see below).

## Data Transformation / Backfill Pattern

If a future schema change requires transforming existing documents (e.g., renaming a field across all docs, splitting a field, enforcing a new required field), put a one-off script in `scripts/migrations/` following this pattern:

```ts
// scripts/migrations/YYYY-MM-DD-description.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Query affected docs
  // 2. Transform each doc
  // 3. updateMany / $currentDate / etc
  // 4. Log count of transformed docs
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Rules:

- **Idempotent** — safe to re-run. Use `$set` + a marker field, or check for the new shape before transforming.
- **Logged** — print before/after counts so an operator can verify.
- **Guarded** — use `if (process.env.NODE_ENV !== 'production') { ... }` guards where destructive.
- **Committed** — keep migration scripts in version control forever, even after they've run, as a record of past changes.

No backfill scripts exist yet because all new fields landed in 7.25–7.26 are either optional, `@default(now())`, or arrays with sensible defaults.

## Parity Verification: `pnpm prisma:parity`

Because Mongoose and Prisma coexist, the risk is that field-name mappings drift silently — for example, renaming a Mongoose field without updating the corresponding Prisma `@map()`.

`scripts/prisma-mongoose-parity.ts` (wired as `pnpm prisma:parity`) detects drift at runtime:

1. Connects both Mongoose and Prisma to the same DB
2. For each critical model (User, Post, MessageRoom), runs two round-trips:
   - **Mongoose → Prisma**: create doc via Mongoose, read via Prisma, assert all mapped fields (`admin`/`isAdmin`, `_followingId`/`followingIds`, `enable_voting`/`enableVoting`, `users`/`userIds`) surface correctly on the Prisma side
   - **Prisma → Mongoose**: create via Prisma, read raw via Mongoose, assert the MongoDB document uses the expected field names
3. Runs a **functional parity** round — seeds a `User`+`Group`+`Post` via Mongoose, then:
   - Reads the post via `Post.findById(...).populate('userId', 'username')` (Mongoose)
   - Reads the same post via `prisma.post.findUnique({ include: { user: { select: ... } } })` (Prisma)
   - Asserts the post title, populated author id, and author username match between the two ORMs
   - Asserts `Post.countDocuments({ userId })` equals `prisma.post.count({ where: { userId } })`
4. Cleans up all docs it created (LIFO, in a `finally` block)
5. Exits `0` on success, `1` on any mismatch (with a diff report)

Run it whenever schema/mapping changes:

```bash
pnpm prisma:parity
```

**Requires a live MongoDB instance running as a replica set** (local or staging). Not run in CI for now.

### MongoDB replica set requirement

Prisma's MongoDB connector uses transactions internally for `create`/`update`/`delete`, and MongoDB only supports transactions on replica sets. A standalone `mongod` will fail with:

```
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

**Fix — pick one:**

1. **Local single-node replica set:** start `mongod --replSet rs0`, then once in `mongosh`: `rs.initiate()`. Update `DATABASE_URL` to include `?replicaSet=rs0&directConnection=true`.
2. **Docker:** `docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all` then `docker exec -it mongo-rs mongosh --eval "rs.initiate()"`.
3. **MongoDB Atlas:** Atlas clusters are already replica sets — just paste the connection string into `DATABASE_URL`.

Mongoose operations work against a standalone because Mongoose issues plain `insertOne`/`updateOne` without wrapping them in a transaction — so this constraint only surfaces once Prisma is introduced.

## Integrity Checks

Beyond parity, these commands verify the DB state:

| Command | What it checks |
|---|---|
| `pnpm prisma:validate` | Schema syntax is valid (static check, no DB needed) |
| `pnpm prisma:health` | DB connection works, all 24 models are visible |
| `pnpm prisma:test` | CRUD + relationship round-trip for **all 24 models** (User, Group, Post, Comment, Quote, Vote, VoteLog, Reaction, Message, DirectMessage, MessageRoom, Notification, Activity, Roster, Presence, Typing, UserInvite, UserReport, BotReport, UserReputation, Domain, Creator, Content, Collection) plus 3-level deep traversals |
| `pnpm test:prisma` | Full Jest integration suite — every model, unique-constraint enforcement, 3-level deep `include` traversal (user → posts → comments → commenter; room → messages → reactions → reactor), and a delegate smoke test that calls `count()` on all 24 models |
| `pnpm prisma:parity` | Mongoose↔Prisma field-mapping parity **plus functional parity** — the same logical query via Mongoose `populate()` and Prisma `include()` must return equivalent author id/username and document counts |

## When to Re-Sync

Re-run `pnpm prisma:sync` after:

- Adding or removing a model
- Adding/removing/renaming a field on any model
- Changing an index (`@@index`, `@@unique`)
- Changing an enum
- Bumping `@prisma/client` or `prisma` major versions

Skip the push if only:

- Editing comments
- Reformatting (`pnpm prisma:format`)
- Adding relation fields that don't change the underlying indexes

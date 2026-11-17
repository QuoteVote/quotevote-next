# Model indexes at the switch (#716, #714)

## Why

Mongoose builds every model's missing indexes when it connects (`autoIndex`). On the live database that means unplanned index builds on `users`, `votes` and `messages` the moment the new backend first starts, in the same minutes as the switch checks. Started on a database only the current API had written to, the backend built eight indexes:

| Collection     | Index                                       |
| -------------- | ------------------------------------------- |
| `users`        | `accountStatus_1`                           |
| `votes`        | `postId_1`, `postId_1_userId_1`, `userId_1` |
| `messagerooms` | `postId_1`                                  |
| `presences`    | `status_1`                                  |
| `messages`     | `messageRoomId_1_created_-1`, `userId_1`    |

They're non-unique, and the current API works with them in place.

Separately, `typings.expiresAt_1` exists without its TTL, because the model declared `expiresAt` twice and the plain index won. MongoDB won't add a TTL to an existing index by rebuilding from the model, so typing records never expired. Readers already ignore records past `expiresAt`.

## What changed

- With `NODE_ENV=production`, the backend connects with `autoIndex: false` and `autoCreate: false`, so starting it never changes indexes. Development and tests keep Mongoose's defaults.
- `Typing` declares `expiresAt` once, as the TTL index.
- `pnpm db:model-indexes` compares the indexes of every model the backend loads with the database's.

## The switch step

From `quotevote-backend`, with `MONGO_URI` (or `DATABASE_URL`) set to the target database:

```bash
pnpm db:model-indexes           # report only, changes nothing
pnpm db:model-indexes --apply   # build what's missing, one at a time
```

- Run it on the staging copy first, then on the live database at a quiet time before the switch.
- `--apply` builds each missing index with progress, then adds the TTL to `typings.expiresAt_1` with `collMod` (no drop, no rebuild).
- It's safe to run twice: the second run prints `Nothing to do.`
- A conflict (an existing index with the same key but different options, or a model declaring one key twice) is reported and stops the run before anything changes. Nothing is ever dropped.
- It prints collection and index names only.

On a local copy shaped like the live database, the report listed exactly the eight indexes above and the TTL. `--apply` built them in about a second, the next run printed `Nothing to do.`, and the result matched what the old startup built, plus the TTL.

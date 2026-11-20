# Rollback after the switch

Part of #183. This covers going back to the current API (the legacy server) after the new backend has gone live and written to the database. It is the "written and tested rollback plan" item. It was rehearsed end to end on a local copy on 2026-11-16 (see [Rehearsal](#rehearsal)), and the same run should be repeated on staging before the switch.

## Before the switch

These run on the staging copy first, then on the live database at a quiet time before the switch, from `quotevote-backend` with the database URL set:

1. **Data check:** `pnpm data:check` (#689), kept as the baseline to compare after a rollback.
2. **Rooms with an empty member:** `pnpm rooms:audit` (#713). Read-only, counts only.
3. **Indexes:** `pnpm db:model-indexes` to see what's missing, then `pnpm db:model-indexes --apply` to build it one index at a time and add the typing TTL (#716, #714). It also builds the indexes of the collections only the new backend uses (buddies, blocks, direct messages, Terms acceptances). A second run prints `Nothing to do.`; a conflict stops it before any change. See [model-indexes.md](model-indexes.md).
4. **Unique indexes:** `pnpm db:unique-indexes`, then `pnpm db:unique-indexes --apply` (#694, #702). It counts records that share a key first and skips that index if there are any, listing them to resolve.

## When to roll back

Roll back when the new backend causes a problem that can't be fixed forward quickly: sign-in failures, errors on the main pages, data that reads wrong, or load the database can't handle. Error tracking and the health endpoint are the first signals.

## Steps

1. **Point the site back at the current API.** The 2.0 frontend speaks the new backend's contract (buddies and blocks use different operations), so it can't simply be pointed at the legacy server. Promote the last frontend deployment from before the switch (the `main` build that talks to the legacy API) on the hosting platform. That build is already known to work against the legacy API.
2. **Keep the legacy API running.** It stays deployed and connected to the same database until 2.0 is marked final, so there is nothing to restart. Check its health and logs.
3. **Stop the new backend**, so nothing writes from both sides and the roster sync in the next step sees a settled state. Scheduled jobs on it (presence cleanup) stop with it.
4. **Copy buddies and blocks back to the rosters** (#695), from `quotevote-backend` with `DATABASE_URL` set to the live database:
   - `pnpm roster:rollback --db <database name>` first. It's a dry run and prints only counts: rows to create, update and remove.
   - Then `pnpm roster:rollback --db <database name> --apply`. It ends with `PASS: rosters match buddyrelationships and userblocks`. A second run changes nothing, so it's safe to repeat if it stops halfway.
   - `--db` has to match the database in `DATABASE_URL`, or it refuses to run.
5. **Check the result:** sign in, the home feed, a post with its discussion, a profile, messages and notifications, as in the smoke test (#108), plus a buddy list and a block.
6. **Tell users if needed.** True/False and Like/Dislike responses on votes cast after the switch are lost until #693 is in (see below).

No database restore is needed. Both backends read and write the same database, and the checks below show that legacy reads what the new backend writes.

## What carries back

Tested locally: the new backend (`staging` with #685, #686 and #687) wrote to a copy of a legacy database, then the production legacy image (3452e87) and the `main` frontend ran against it. Every query the `main` frontend sends was run with the new records, and the main pages were loaded in a browser.

These read and work on legacy:

- **Accounts:** accounts created through a member invite or an approved access request, and passwords reset on the new backend, all sign in on legacy. Disabled accounts stay disabled, because legacy checks the same `accountStatus` field.
- **Content:** posts (including ones in a new tag, featured, approved, bookmarked, reported or with voting turned off), deleted posts (hidden), comments (edited and deleted), quotes, reactions, follows, profile edits and avatars.
- **Messages:** direct and post chat rooms, messages, reactions and read state. Legacy can reply in rooms the new backend created.
- **Notifications, tags, admin queues:** pending access requests, bot reports and the user list.
- **Writing on top:** legacy can comment, vote, message, follow and post on records the new backend created, and new accounts can post through legacy.
- **Going forward again:** the new backend reads everything legacy wrote afterwards.

## What doesn't carry back

- **Vote responses and counts.** The new backend stores a vote's response as a list (`["#agree"]`), and legacy reads that as empty, so the site shows such votes as Agree or Disagree by direction, and True/False or Like/Dislike are lost. The new backend also doesn't update a post's `upvotes`, `downvotes` and `votedBy`, so legacy shows counts without any vote cast after the switch. Both are fixed on the new backend side in #693. Until then, votes cast after the switch show this way after a rollback.
- **Buddies and blocks, until step 4 runs.** The new backend keeps them in `buddyrelationships` and `userblocks`. Legacy reads `rosters`, which the new backend never writes, so without step 4 buddy requests, new buddies and blocks made after the switch don't appear, and buddies removed or people unblocked after the switch still show. With step 4 they all carry back (see [Rehearsal](#rehearsal)).
- **Member invite links** sent by the new backend and still unused weren't checked against legacy. If they don't open the signup there, those people need a new invite.
- **New-only records** (`terms_acceptances`, `userinvites` rows for member invites, rate limit counters, `buddyrelationships`, `userblocks`, `solidconnections`) are ignored by legacy. They stay in the database and are used again if the new backend comes back.
- **Indexes built for the new backend.** `pnpm db:model-indexes --apply` (see [Before the switch](#before-the-switch)) builds the indexes the new backend's models declare and legacy never created: `users.accountStatus`, `votes` (`postId`, `postId`+`userId`, `userId`), `messagerooms.postId`, `presences.status` and two on `messages`, plus the TTL on `typings.expiresAt` (#716, #714). They're non-unique and legacy works with them, so they stay. Since #730 the new backend no longer builds them when it starts.

## Already broken on legacy

- The admin "user reports" view fails on legacy with any report, old or new (`_reporterId` is returned as an object where the schema expects a string). It is not caused by the new backend.
- Before #726, a first direct message sent from a profile in the `main` frontend could save a room with a `null` member (#713). Legacy fails the sender's `messageRooms` query on such a room, so they get an error on every page and their Messages list doesn't load. The `main` frontend no longer writes them, and the new backend skips the ones already saved (#727). `pnpm rooms:audit` counts them; they can't be repaired, since the recipient was never saved.

## Rehearsal

Run on 2026-11-16 on a local copy of a database written by legacy, with the collections only the new backend writes removed, so it started as production would:

- **Legacy:** the production image (3452e87) and a production build of `main`.
- **New backend:** the `staging` image with `NODE_ENV=production` and a production build of `staging`.
- **Roster sync:** `roster:rollback` from #710.

| Stage              | What was done                                                                                                                                              | Result                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| On legacy          | Post, True vote, comment, quote, follow, accepted buddy pair, pending request, block, direct message                                                       | All saved                                                                                                                                           |
| Switch             | `roster:backfill` dry run, then `--apply` twice                                                                                                            | Counts matched `roster:audit` (1 accepted, 2 pending, 2 blocks); the second run added nothing                                                       |
| On the new backend | Read everything legacy wrote                                                                                                                               | Post, vote, comment, quote, buddies, blocks and messages all read correctly                                                                         |
| On the new backend | Post, Like and False votes, comment, quote, follow, accept a legacy request, new request, remove a buddy, block, unblock, reply in a legacy room, new room | All saved. Post vote counts didn't change (#693)                                                                                                    |
| Rollback           | Stop the new backend, `roster:rollback` dry run, then `--apply` twice                                                                                      | Create 3, update 1, remove 3; `PASS`; the second run changed nothing. A wrong `--db` was refused                                                    |
| On legacy          | Read everything, as each member                                                                                                                            | Everything carried back except vote responses and counts (above). The block is enforced on legacy. Pages load in the `main` frontend with no errors |

Before the switch on staging, repeat it with the staging copy of the database and compare the data check reports (`pnpm data:check`, #689) before and after.

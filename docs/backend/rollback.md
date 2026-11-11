# Rollback after the switch

Part of #183. This covers going back to the current API (the legacy server) after the new backend has gone live and written to the database. It is the "written and tested rollback plan" item. It still has to be rehearsed on staging, which this document is written to be used for.

## When to roll back

Roll back when the new backend causes a problem that can't be fixed forward quickly: sign-in failures, errors on the main pages, data that reads wrong, or load the database can't handle. Error tracking and the health endpoint are the first signals.

## Steps

1. **Point the site back at the current API.** The 2.0 frontend speaks the new backend's contract, so it can't simply be pointed at the legacy server. Promote the last frontend deployment from before the switch (the `main` build that talks to the legacy API) on the hosting platform. That build is already known to work against the legacy API.
2. **Keep the legacy API running.** It stays deployed and connected to the same database until 2.0 is marked final, so there is nothing to restart. Check its health and logs.
3. **Stop the new backend**, or leave it running with no traffic, so nothing writes from both sides. Scheduled jobs on it (presence cleanup) stop with it.
4. **Check the result:** sign in, the home feed, a post with its discussion, a profile, messages and notifications, as in the smoke test (#108).
5. **Tell users if needed.** Buddy and block changes made after the switch need attention (see below).

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

- **Vote responses and counts.** The new backend stores a vote's response as a list (`["#agree"]`), and legacy reads that as empty, so the site shows such votes as Agree or Disagree by direction, and True/False or Like/Dislike are lost. The new backend also doesn't update a post's `upvotes`, `downvotes` and `votedBy`, so legacy shows counts without any vote cast after the switch. Both are fixed on the new backend side (see the linked issue). Until then, votes cast after the switch show this way after a rollback.
- **Buddies and blocks.** The new backend keeps them in `buddyrelationships` and `userblocks`. Legacy reads `rosters`, which the new backend never writes, so buddy requests, new buddies and blocks made after the switch don't appear after a rollback, and buddies removed after the switch still show. Run the reverse sync (see the linked issue) before or right after the rollback, so blocks in particular aren't lost.
- **Member invite links** sent by the new backend and still unused weren't checked against legacy. If they don't open the signup there, those people need a new invite.
- **New-only records** (`terms_acceptances`, `userinvites` rows for member invites, rate limit counters) are ignored by legacy. They stay in the database and are used again if the new backend comes back.

## Already broken on legacy

The admin "user reports" view fails on legacy with any report, old or new (`_reporterId` is returned as an object where the schema expects a string). It is not caused by the new backend.

## Rehearsal on staging

Run the same check on staging before the switch, with the staging copy of the database:

1. Use the new backend for the actions above with test accounts.
2. Run the legacy API against the same database, and the `main` frontend against it.
3. Go through step 4 above, and compare the data check reports (`pnpm data:check`, #689) before and after.

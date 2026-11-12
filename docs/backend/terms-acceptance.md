# Terms acceptance (#573)

## Source of truth

| Concern                  | Location                                                                    |
| ------------------------ | --------------------------------------------------------------------------- |
| Current version string   | `quotevote-backend/app/data/utils/termsPolicy.ts` (`CURRENT_TERMS_VERSION`) |
| Content digest (SHA-256) | Same file (`CURRENT_TERMS_HASH`)                                             |
| Published Terms text     | Follows #568 (frontend `termsSource.txt` + contract test land there)        |

When Terms text changes (with #568): update the published source, recompute the SHA-256 hex digest, bump `CURRENT_TERMS_VERSION` and `CURRENT_TERMS_HASH` in both packages, then re-run the frontend contract test.

The server never trusts a client-supplied hash or timestamp. It only accepts `acceptedTermsVersion === CURRENT_TERMS_VERSION` and stores the server constants.

## Persistence

Append-only Prisma model `TermsAcceptance` (`terms_acceptances` collection):

- `userId` — from the created/invited user (never a client-forged identity)
- `termsVersion`, `termsHash` — server constants at write time
- `acceptedAt` — `@default(now())`
- `source` — `direct_registration` \| `invite_completion`
- `@@unique([userId, termsVersion])`

No `User.acceptedTerms` boolean. Legacy accounts with no row remain distinguishable as never accepted. No backfill. No IP/UA by default.

Acceptance records are **not** exposed on public User GraphQL fields. Future support retrieval should be an admin-only query.

## Enforcement

1. **`POST /auth/register`** — always refused with 403 (#665). Membership is invitation-only, so it creates no account and no `TermsAcceptance`, whatever Terms version is sent. `direct_registration` stays in the `TermsAcceptance` source enum for any existing rows.
2. **`completeSignup(token, username, password, acceptedTermsVersion)`** — invite completion only. Invite JWTs have `type: invite_signup` and are rejected by `verifyToken` for general sessions. Requires `User.status === 4` and no password.
3. **`updateUser`** — may still hash password changes for completed accounts (Settings). Unfinished invites (`status` 1 or 4, no password) must use `completeSignup`.
4. **`POST /auth/guest`** — removed (consentless accounts).

Frontend wiring (`completeSignup` / `verifyInviteSignupToken` / `/terms`) ships with #568 so beta can keep talking to the live API until cutover.

## Invitation flow (ported for Terms gate)

Invite lifecycle uses legacy numeric `User.status` (admin UI / `userInviteRequests` already filter on these). Do **not** overload `accountStatus` for invite state — that field stays for moderation (`active` / `disabled` / …).

1. `requestUserAccess` — creates a user with `status: 1`, email as temporary username, no password. Re-opens declined invites (`status: 2` → `1`). An unfinished invite (`status: 4`) is handled as in [Expired invites](#expired-invites-691). An address with a password is refused, whatever its `accountStatus`.
2. `sendUserInviteApproval` (admin) — approve → `status: 4`, record a `UserInvite` (`pending`, `expiresAt` in one day, no inviter) and email a one-day invite-signup token; decline → `status: 2` (not `accountStatus: disabled`). The token itself is unchanged: it carries no `inviteId`.
3. `verifyInviteSignupToken` — public query for the signup form (requires `status: 4`, no password).
4. `completeSignup` — sets username/password, ensures `accountStatus: active`, writes `TermsAcceptance` with `invite_completion`.

### Member invites (#672)

A member's invite skips the admin queue. Public requests still go through steps 1 and 2.

- `sendUserInvite` — signed-in, active members only; 10 invites an hour and at most 20 unused (pending, unexpired) invites per member. Refuses an address with an account, a pending request or a declined request. Creates the account at `status: 4` (so it never shows in `userInviteRequests`) and a `UserInvite` (`pending`, `expiresAt` in 7 days, `invitedBy` = the member), then emails `invite_url` and `inviter_name`. If the email fails, the account and invite are removed and the member gets an error. An expired, unused invite can be sent again: the same invite gets a new expiry and link.
- The token is the same `invite_signup` / `completeSignup` token with `inviteId` and `email` claims, valid 7 days. The link is only ever in the email.
- The `UserInvite` row decides whether the link works: `verifyInviteSignupToken` and `completeSignup` require it to be `pending` and unexpired, with the token, invite and account emails matching. `completeSignup` claims it with one conditional `updateMany` (`pending` → `accepted`), so a link works once even with two requests at once, and puts it back to `pending` if the final account update fails.
- Tokens without `inviteId` (admin approval) work as before.

### Expired invites (#691)

An account invited by a member or approved by an admin that never finished signup (`status: 4`, no password) can ask for access again:

- If any `pending` `UserInvite` for the address is still unexpired, `requestUserAccess` refuses with "An invite was already sent to this email. Check your inbox for the signup link." The request forms show that message.
- Otherwise each lapsed invite is marked `expired`, the account goes back to `status: 1` (so it shows in `userInviteRequests`), and the usual confirmation email is sent. Approvals made before approvals were recorded have no `UserInvite`, so they count as lapsed.
- Each step is a conditional update on the record as it was read. If a member renews the invite at the same moment, the person is told to check their inbox; if they finish signup at the same moment, they get "Email already exists"; two requests at once both succeed.
- `checkDuplicateEmail` no longer counts an unfinished invite as an existing account, so the request forms that check first reach `requestUserAccess`.

## Retention and cutover

Retention follows the Privacy Notice (#566 / #569) and account-deletion policy. Do not enable the production Terms gate until Privacy Notice publication, Terms effective date, and founder go-live approval for v2.0.0 are coordinated with #568/#569.

**Route note:** the Next.js frontend no longer calls `/auth/register`; `/auths/signup` without an invite redirects to Request Access. The legacy API's `/register` is outside this backend, so check it at cutover.

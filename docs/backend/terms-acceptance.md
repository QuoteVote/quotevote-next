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

1. `requestUserAccess` — creates a user with `status: 1`, email as temporary username, no password. Re-opens only declined invites (`status: 2` → `1`); approved invites (`status: 4`) are left alone so emailed signup links stay valid.
2. `sendUserInviteApproval` (admin) — approve → `status: 4` and email a one-day invite-signup token; decline → `status: 2` (not `accountStatus: disabled`).
3. `verifyInviteSignupToken` — public query for the signup form (requires `status: 4`, no password).
4. `completeSignup` — sets username/password, ensures `accountStatus: active`, writes `TermsAcceptance` with `invite_completion`.

## Retention and cutover

Retention follows the Privacy Notice (#566 / #569) and account-deletion policy. Do not enable the production Terms gate until Privacy Notice publication, Terms effective date, and founder go-live approval for v2.0.0 are coordinated with #568/#569.

**Route note:** the Next.js frontend no longer calls `/auth/register`; `/auths/signup` without an invite redirects to Request Access. The legacy API's `/register` is outside this backend, so check it at cutover.

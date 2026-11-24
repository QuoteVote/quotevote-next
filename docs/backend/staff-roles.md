# Staff roles (#616)

Three roles, stored as plain booleans on `User`. A user may hold several, and an admin can do everything.

| Role            | Prisma field        | `context.user` field | Default |
| --------------- | ------------------- | -------------------- | ------- |
| Administrator   | `isAdmin` (`admin`) | `admin`              | false   |
| Moderator       | `isModerator`       | `isModerator`        | false   |
| Invite approver | `isInviteApprover`  | `isInviteApprover`   | false   |

The fields have no index. Older user records without a field read as false, so nothing needs migrating.

## Checking a role

Every staff resolver starts with `requireRole(context, role)` from `app/data/utils/requireRole.ts`:

- no signed-in user → `UNAUTHENTICATED` ("Authentication required")
- the user lacks the role and isn't an admin → `FORBIDDEN` ("Admin access required", "Moderator access required" or "Invite approver access required")

`hasRole(user, role)` answers the same question without throwing.

Roles are always read from `context.user`, which `app/context.ts` loads from the database on every request, never from the `admin` claim in the token. A role change therefore takes effect on the next request.

## Who can do what

| Operation                                                            | Role                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `userInviteRequests`, `sendUserInviteApproval`                       | invite approver                                                          |
| `getUserReports`, `getBotReportedUsers`, `disableUser`, `enableUser` | moderator                                                                |
| `deletePost` on someone else's post                                  | moderator, for a reported post whose author isn't staff; admin, any post |
| `users`, `updateFeaturedSlot`, `setUserRoles`, `staffActions`        | admin                                                                    |

`sendUserInviteApproval` only decides access requests and unfinished invites: approving or declining an account that finished signup (member, moderator or admin) is refused with "User has already completed signup", so an invite approver can't touch accounts outside the request queue.

Moderators act on members only. `disableUser` and `enableUser` refuse another staff account (moderator or invite approver) unless the caller is an admin ("Only admins can disable or enable staff accounts"), and admins still can't be disabled ("Cannot disable admin accounts"). A post counts as reported when it has a report (`reportedBy` or the legacy `reported` count); removing someone else's post is logged as `content_removed` with the author as the target and `post <post id>` as the detail, while an author deleting their own post isn't a staff action and isn't logged. Comments and quotes have no reports, so removing other people's stays with admins.

`__tests__/unit/adminPermissions.test.ts` (#690) covers guests, members and admins for these operations, and `__tests__/unit/staffRoles.test.ts` covers moderators and invite approvers.

## Seeing roles

- **Login:** the `/auth/login` response's `user` carries `admin`, `isModerator` and `isInviteApprover`, so the frontend knows which tabs to show. The token itself carries no new role claims.
- **GraphQL:** `User.isModerator` and `User.isInviteApprover` are shown to the user themselves and to admins, and are `null` for anyone else, so who holds a staff role isn't public. (`User.admin` is unchanged.) An admin's view of other users goes through a per-request loader (`app/data/utils/staffRoleLoader.ts`) that reads both flags for every user in the response with one query. `setUserRoles` clears that user's entry after writing, so a later field in the same request reads the new flags. Its types live in `app/types/staffRoles.ts`.

## Managing roles

`setUserRoles(userId, roles)` (admin only) sets a user's roles to exactly the list given, any of `admin`, `moderator` and `inviteApprover`; an empty list removes them all. It returns the user with their roles.

- Roles only go to accounts that finished signup ("Roles can only be given to accounts that finished signup").
- An admin can't remove their own admin role ("You can't remove your own admin role"), and the last admin can't be removed ("The last admin can't be removed").
- The change runs in one transaction that also writes the acting admin's own record. Two role changes involving the same admins (for example, two admins removing each other at once) therefore conflict: one goes through and the other gets `CONFLICT` ("Roles were changed by someone else at the same time. Please try again."), so the site can't end up with no admin. Prisma transactions need MongoDB running as a replica set; local development already runs one.
- Asking for the roles a user already has changes and logs nothing.

## Staff log

`StaffAction` (`staff_actions` collection, Prisma only) records each staff decision: `actorId`, `action`, `targetId`, an optional `detail` and `createdAt`. It's append-only, with no relation to `User`, so user records are untouched.

| `action`                                             | Written by                                                                        | `detail`         |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| `role_granted`, `role_revoked`                       | `setUserRoles`, one entry per role changed                                        | the role         |
| `invite_approved`, `invite_declined`, `invite_reset` | `sendUserInviteApproval` (a reset only when it moved the request back to pending) |                  |
| `user_disabled`, `user_enabled`                      | `disableUser`, `enableUser`                                                       |                  |
| `content_removed`                                    | `deletePost` on someone else's post; the target is the post's author              | `post <post id>` |

Each mutation records its decision in one line after the change has gone through: `await recordStaffAction(context, 'invite_approved', userId)` from `app/data/utils/staffActions.ts`. A failed log write is reported to the server log and doesn't fail the mutation, since the change already happened.

`staffActions(limit, offset)` (admin only) lists entries newest first, 50 by default and at most 100, with `actor` and `target` users filled in (`target` is null when the target isn't a user). The legacy backend doesn't write this log, so it starts at the switch to the new backend.

## Still to come

Following the plan on #616:

- **Parts 4 and 5, after the switch to the new backend:** the control panel per role, then end-to-end tests.

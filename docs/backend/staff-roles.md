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

| Operation                                                                        | Role                                               |
| -------------------------------------------------------------------------------- | -------------------------------------------------- |
| `sendUserInviteApproval`                                                         | invite approver                                    |
| `getUserReports`, `getBotReportedUsers`                                          | moderator                                          |
| `userInviteRequests`, `users`, `disableUser`, `enableUser`, `updateFeaturedSlot` | admin only for now; moved to their roles in part 3 |

`__tests__/unit/adminPermissions.test.ts` (#690) covers guests, members and admins for these operations, and `__tests__/unit/staffRoles.test.ts` covers moderators and invite approvers.

## Still to come

Following the plan on #616:

- **Part 2:** role management and the log: `setUserRoles`, a `StaffAction` record of who did what, and the role flags on the current user.
- **Part 3:** the remaining admin operations behind their roles.
- **Parts 4 and 5, after the switch to the new backend:** the control panel per role, then end-to-end tests.

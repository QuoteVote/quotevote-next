/**
 * Types for the batched role lookups behind `User.isModerator` and
 * `User.isInviteApprover` (#616). See app/data/utils/staffRoleLoader.ts.
 */

/** A user's staff role flags other than admin. */
export interface StaffRoleFlags {
  isModerator: boolean;
  isInviteApprover: boolean;
}

/** A field resolver waiting for its user's flags. */
export interface StaffRoleWaiting {
  userId: string;
  resolve: (flags: StaffRoleFlags | null) => void;
  reject: (err: unknown) => void;
}

/** The per-request loader: who is waiting, whether a read is scheduled, and what is known. */
export interface StaffRoleLoader {
  queue: StaffRoleWaiting[];
  scheduled: boolean;
  cache: Map<string, Promise<StaffRoleFlags | null>>;
}

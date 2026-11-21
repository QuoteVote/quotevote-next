/**
 * Batched role lookups for `User.isModerator` and `User.isInviteApprover` (#616).
 *
 * When an admin's query lists many users, each user's two role fields ask for
 * that user's roles. Requests made in the same tick are gathered and read with one
 * query that returns both flags, and the result is kept for the rest of the
 * request, so a page of users costs one query instead of two per row.
 */

import type { GraphQLContext } from '~/types/graphql';

export interface StaffRoleFlags {
  isModerator: boolean;
  isInviteApprover: boolean;
}

interface Waiting {
  userId: string;
  resolve: (flags: StaffRoleFlags | null) => void;
  reject: (err: unknown) => void;
}

interface Loader {
  queue: Waiting[];
  scheduled: boolean;
  cache: Map<string, Promise<StaffRoleFlags | null>>;
}

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** One loader per request context, dropped with the context. */
const loaders = new WeakMap<object, Loader>();

async function flush(context: Pick<GraphQLContext, 'prisma'>, loader: Loader): Promise<void> {
  const batch = loader.queue;
  loader.queue = [];
  loader.scheduled = false;

  try {
    const ids = [...new Set(batch.map((w) => w.userId))];
    const rows = await context.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, isModerator: true, isInviteApprover: true },
    });
    const byId = new Map(
      rows.map((r) => [
        r.id,
        { isModerator: r.isModerator === true, isInviteApprover: r.isInviteApprover === true },
      ])
    );
    batch.forEach((w) => w.resolve(byId.get(w.userId) ?? null));
  } catch (err) {
    // Don't keep a failure: a later field in the same request may try again.
    batch.forEach((w) => loader.cache.delete(w.userId));
    batch.forEach((w) => w.reject(err));
  }
}

/** This user's role flags, or null when there is no such user. */
export function loadStaffRoles(
  context: Pick<GraphQLContext, 'prisma'>,
  userId: string
): Promise<StaffRoleFlags | null> {
  if (!OBJECT_ID_PATTERN.test(userId)) return Promise.resolve(null);

  let loader = loaders.get(context);
  if (!loader) {
    loader = { queue: [], scheduled: false, cache: new Map() };
    loaders.set(context, loader);
  }

  const cached = loader.cache.get(userId);
  if (cached) return cached;

  const active = loader;
  const promise = new Promise<StaffRoleFlags | null>((resolve, reject) => {
    active.queue.push({ userId, resolve, reject });
  });
  active.cache.set(userId, promise);

  if (!active.scheduled) {
    active.scheduled = true;
    // Wait until GraphQL has asked for every field in this round, then read once.
    void Promise.resolve().then(() => process.nextTick(() => void flush(context, active)));
  }
  return promise;
}

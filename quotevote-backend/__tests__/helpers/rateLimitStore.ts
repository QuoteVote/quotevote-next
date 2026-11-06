/**
 * In-memory stand-in for the `ratelimits` collection. It answers the two raw
 * commands rateLimiter.ts sends: the findAndModify that counts, and the delete
 * that resets. Index creation is accepted and ignored.
 */

interface StoredLimit {
  count: number;
  resetAt: number;
}

type DateOperand = { $date: string };

interface CountCommand {
  findAndModify: string;
  query: { _id: string };
  update: [
    {
      $set: {
        count: { $cond: [{ $gt: [string, DateOperand] }, unknown, number] };
        resetAt: { $cond: [unknown, string, DateOperand] };
      };
    },
  ];
}

export interface RateLimitStore {
  docs: Map<string, StoredLimit>;
  $runCommandRaw: jest.Mock;
}

export function createRateLimitStore(): RateLimitStore {
  const docs = new Map<string, StoredLimit>();
  const $runCommandRaw = jest.fn(async (command: Record<string, unknown>) => {
    if ('createIndexes' in command) return { ok: 1 };
    if ('delete' in command) {
      const [{ q }] = command.deletes as { q: { _id: string } }[];
      docs.delete(q._id);
      return { ok: 1 };
    }
    const { query, update } = command as unknown as CountCommand;
    const now = new Date(update[0].$set.count.$cond[0].$gt[1].$date).getTime();
    const nextReset = new Date(update[0].$set.resetAt.$cond[2].$date).getTime();
    const current = docs.get(query._id);
    const next =
      current && current.resetAt > now
        ? { count: current.count + 1, resetAt: current.resetAt }
        : { count: 1, resetAt: nextReset };
    docs.set(query._id, next);
    return {
      value: {
        _id: query._id,
        count: next.count,
        resetAt: { $date: new Date(next.resetAt).toISOString() },
      },
      ok: 1,
    };
  });
  return { docs, $runCommandRaw };
}

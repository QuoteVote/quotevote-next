/**
 * Small helpers for loading related records for a page of results with a fixed
 * number of queries, instead of one query per entry.
 */

export const unique = (ids: (string | null | undefined)[]): string[] => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

/** Skip the query when there is nothing to look up. */
export async function whenAny<T>(
  ids: string[],
  load: (ids: string[]) => Promise<T[]>
): Promise<T[]> {
  return ids.length > 0 ? load(ids) : [];
}

/**
 * Deleted flags are checked in code rather than in the query: legacy documents
 * may not have the field, and a `deleted: false` filter would skip them.
 */
export const isLive = (row: { deleted?: boolean | null }): boolean => row.deleted !== true;

export const groupIdsByPost = (
  rows: { id: string; postId: string; deleted?: boolean | null }[]
): Map<string, { _id: string }[]> => {
  const byPost = new Map<string, { _id: string }[]>();
  for (const row of rows.filter(isLive)) {
    const list = byPost.get(row.postId) ?? [];
    list.push({ _id: row.id });
    byPost.set(row.postId, list);
  }
  return byPost;
};

/**
 * Vote columns safe to read from legacy votes. `tags` is left out: legacy stores
 * it as a single string, which Prisma can't read as a list.
 */
export const VOTE_SELECT = {
  id: true,
  userId: true,
  postId: true,
  type: true,
  startWordIndex: true,
  endWordIndex: true,
  deleted: true,
  created: true,
} as const;

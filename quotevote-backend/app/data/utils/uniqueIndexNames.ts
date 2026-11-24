import type { UniqueIndexMapNames } from '~/types/uniqueIndexes';

/**
 * Names the schema sets with `map:` on a unique index (`@unique(map: ...)` or
 * `@@unique([...], map: ...)`), by model and comma-joined Prisma field names.
 *
 * Prisma's runtime metadata doesn't include `map:`, and the deployed backend has no schema
 * files, so they're listed here. Without them `pnpm db:unique-indexes` would create a
 * missing index under a name Prisma doesn't expect (#747).
 * `__tests__/unit/utils/uniqueIndexNames.test.ts` fails when this list and `prisma/schema`
 * disagree, so a new `map:` on a unique index goes in the list in the same PR.
 */
export const UNIQUE_INDEX_MAP_NAMES: UniqueIndexMapNames = {
  BotReport: { 'reporterId,userId': '_reporterId_1__reportedUserId_1' },
};

import type { ModelIndexSource } from '~/types/modelIndexes';

/**
 * Indexes the Prisma schema declares with `@@index` on collections that have no Mongoose
 * model. `pnpm db:model-indexes` reads the Mongoose models and `pnpm db:unique-indexes`
 * only the unique indexes, so without this list these were never built at the switch.
 *
 * Prisma's runtime metadata doesn't include `@@index`, and the deployed backend has no
 * schema files, so they're listed here. `__tests__/unit/utils/prismaOnlyIndexes.test.ts`
 * fails when this list and `prisma/schema` disagree. Names follow Prisma's own
 * (`Model_field_idx`), so Prisma sees them as the indexes it declares.
 */
export const PRISMA_ONLY_INDEXES: ModelIndexSource[] = [
  {
    collection: 'buddyrelationships',
    indexes: [
      [{ requesterId: 1, status: 1 }, { name: 'BuddyRelationship_requesterId_status_idx' }],
      [{ recipientId: 1, status: 1 }, { name: 'BuddyRelationship_recipientId_status_idx' }],
    ],
  },
  {
    collection: 'directmessages',
    indexes: [
      [{ userId: 1 }, { name: 'DirectMessage_userId_idx' }],
      [{ created: 1 }, { name: 'DirectMessage_created_idx' }],
    ],
  },
  {
    collection: 'terms_acceptances',
    indexes: [[{ userId: 1 }, { name: 'TermsAcceptance_userId_idx' }]],
  },
  {
    collection: 'userblocks',
    indexes: [[{ blockedUserId: 1 }, { name: 'UserBlock_blockedUserId_idx' }]],
  },
];

/**
 * The Mongoose models' indexes plus the Prisma-only ones. A collection a Mongoose model
 * already covers keeps only the model's indexes.
 */
export function withPrismaOnlyIndexes(models: ModelIndexSource[]): ModelIndexSource[] {
  const covered = new Set(models.map((m) => m.collection));
  return [...models, ...PRISMA_ONLY_INDEXES.filter((p) => !covered.has(p.collection))];
}

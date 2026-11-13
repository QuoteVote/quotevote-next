/// <reference types="node" />
/**
 * Creates the unique indexes the Prisma schema declares that are missing from the database
 * at DATABASE_URL (#694). It never drops or changes an index. The backend also runs this at
 * startup; the script is for checking a database before the switch.
 *
 * Usage:
 *   pnpm db:unique-indexes [--dry-run]
 *     --dry-run  lists what would be created, without creating anything.
 *
 * Exits with 1 if records share a key or an index conflicts, and lists them.
 */
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ensureUniqueIndexes,
  formatUniqueIndexResults,
  needsAttention,
} from '~/data/utils/uniqueIndexes';
import type { UniqueIndexModel } from '~/types/uniqueIndexes';

config();

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const dryRun = process.argv.includes('--dry-run');

  const prisma = new PrismaClient();
  try {
    const results = await ensureUniqueIndexes({
      run: (command) => prisma.$runCommandRaw(command as Prisma.InputJsonObject),
      models: Prisma.dmmf.datamodel.models as unknown as UniqueIndexModel[],
      dryRun,
    });
    console.log(formatUniqueIndexResults(results));

    const attention = needsAttention(results);
    if (attention.length > 0) {
      console.log(
        `\n${attention.length} index(es) need attention. Resolve the records listed above and run again.`
      );
      process.exitCode = 1;
    } else if (dryRun) {
      console.log('\nDry run: nothing was created.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

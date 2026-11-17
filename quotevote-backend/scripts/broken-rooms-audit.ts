/// <reference types="node" />
/**
 * Switch check for #713: counts message rooms saved with an empty member, and the
 * messages in them. Read-only, and prints counts only (no ids, names or emails).
 *
 * Usage: pnpm rooms:audit
 */
import { PrismaClient } from '@prisma/client';
import { summarizeBrokenRooms } from '~/data/utils/brokenRooms';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    console.log(JSON.stringify(await summarizeBrokenRooms(prisma), null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('rooms audit failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});

/// <reference types="node" />
/**
 * Replica Set Preflight Check
 *
 * Prisma's MongoDB connector uses transactions internally for create/update/delete.
 * MongoDB only supports transactions on replica sets. This script detects whether
 * the configured DATABASE_URL points at a replica set and fails fast with a
 * friendly, actionable message if not — so we never surface the raw P2031 error
 * from the middle of a test run.
 *
 * Exits 0 on success (replica set detected).
 * Exits 1 with an error message otherwise.
 *
 * Usage: tsx scripts/check-replica-set.ts
 *        (Wired as the preflight step before pnpm test:prisma / prisma:test / prisma:parity.)
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const REPLICA_SET_HINT = `
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  MongoDB is not running as a replica set.                               │
│                                                                             │
│  Prisma requires a replica set because it uses transactions for             │
│  create/update/delete operations. A standalone mongod cannot serve these.   │
│                                                                             │
│  Fix — pick one:                                                            │
│                                                                             │
│  1. Docker (fastest):                                                       │
│     docker run -d --name mongo-rs -p 27017:27017 \\                         │
│         mongo:7 --replSet rs0 --bind_ip_all                                 │
│     docker exec -it mongo-rs mongosh --eval "rs.initiate()"                 │
│                                                                             │
│  2. Local mongod:                                                           │
│     Start with:  mongod --replSet rs0 --dbpath <path>                       │
│     Then in mongosh (one time):  rs.initiate()                              │
│                                                                             │
│  3. MongoDB Atlas:                                                          │
│     Atlas clusters are already replica sets — just paste the connection     │
│     string into DATABASE_URL.                                               │
│                                                                             │
│  Then ensure DATABASE_URL in .env includes the replica set, e.g.:           │
│     DATABASE_URL="mongodb://localhost:27017/quotevote?replicaSet=rs0        │
│                   &directConnection=true"                                   │
│                                                                             │
│  See docs/prisma-migration-strategy.md for the full explanation.            │
└─────────────────────────────────────────────────────────────────────────────┘
`;

function isReplicaSetError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /replica\s*set/i.test(msg) || /P2031|P2010/.test(msg);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Probe: attempt a transactional write. This fails with P2031 on a
    // standalone mongod but succeeds on any replica set.
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const probeUser = await prisma.user.create({
      data: {
        email: `replica-probe-${stamp}@internal.test`,
        username: `replica_probe_${stamp}`,
        accountStatus: 'active',
      },
    });
    // Clean up the probe record.
    await prisma.user.delete({ where: { id: probeUser.id } });

    console.log('✅ MongoDB replica set detected — Prisma integration OK');
    process.exit(0);
  } catch (err) {
    if (isReplicaSetError(err)) {
      console.error(REPLICA_SET_HINT);
      process.exit(1);
    }
    console.error('❌ Preflight check failed for a different reason:');
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

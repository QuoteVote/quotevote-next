/// <reference types="node" />
/**
 * Creates or updates the Playwright author account on a local database, since
 * /auth/register no longer creates accounts. Idempotent. Reads the same variables as
 * quotevote-frontend/.env.e2e.local.
 *
 * Usage: E2E_AUTHOR_PASSWORD=... DATABASE_URL=... pnpm seed:e2e-author
 */
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/quotevote';

  // safety guard: only run against a local database
  const { hostname } = new URL(databaseUrl);
  if (!['localhost', '127.0.0.1'].includes(hostname)) {
    throw new Error(`SEED ABORTED: Refusing to run against non-local database "${hostname}".`);
  }

  const password = process.env.E2E_AUTHOR_PASSWORD;
  if (!password) throw new Error('E2E_AUTHOR_PASSWORD is required.');

  const username = (process.env.E2E_AUTHOR_USERNAME || 'authorUser').trim();
  // Matches registeredUser.email in quotevote-frontend/e2e/fixtures: auth.spec signs in with it.
  const email = process.env.E2E_REGISTERED_EMAIL || 'registered.user@quotevote.test';
  const hashedPassword = await bcrypt.hash(password, 10);

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await prisma.user.upsert({
      where: { username },
      create: {
        name: 'E2E Author',
        email,
        username,
        password: hashedPassword,
        accountStatus: 'active',
      },
      update: { email, password: hashedPassword, accountStatus: 'active' },
      select: { id: true },
    });
    console.log(`Seeded E2E author "${username}" <${email}>`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

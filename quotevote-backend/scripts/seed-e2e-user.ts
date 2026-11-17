/// <reference types="node" />
/**
 * Creates a brand-new E2E user on a LOCAL database and prints it as one JSON line:
 *   {"id":"...","username":"...","password":"...","name":"...","email":"..."}
 *
 * Every run makes a different user. Specs that can only happen once per account pair (for
 * example reporting a user as a bot) can therefore run again on the same database with no
 * cleanup: they just ask for a new user. Modelled on seed-e2e-author.ts, including the refusal
 * to run against a database that is not local.
 *
 * Usage: pnpm seed:e2e-user   (needs DATABASE_URL, e.g. from quotevote-backend/.env: it must be
 * the database behind E2E_API_URL, and the script stops with an error if it is not set)
 */
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// quiet: keep dotenv's banner out of stdout, which carries the JSON result.
dotenv.config({ quiet: true });

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
  if (!databaseUrl) throw new Error('DATABASE_URL is required: the database behind E2E_API_URL.');

  // safety guard: only run against a local database
  const { hostname } = new URL(databaseUrl);
  if (!['localhost', '127.0.0.1'].includes(hostname)) {
    throw new Error(`SEED ABORTED: Refusing to run against non-local database "${hostname}".`);
  }

  const suffix = `${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
  const username = `e2e${suffix}`;
  const name = 'E2E Target';
  const email = `${username}@e2e.quotevote.test`;
  const password = `Aa1!${randomBytes(9).toString('base64url')}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const user = await prisma.user.create({
      data: { name, email, username, password: hashedPassword, accountStatus: 'active' },
      select: { id: true },
    });
    console.log(JSON.stringify({ id: user.id, username, password, name, email }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

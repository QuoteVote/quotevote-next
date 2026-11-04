/**
 * Application-Level Prisma Client Singleton
 *
 * Provides a single shared PrismaClient instance for the entire application.
 * Uses globalThis caching to prevent multiple instances during development
 * hot-reloads (`tsx watch`).
 *
 * ## Injection Path
 *
 * **GraphQL resolvers** must always access Prisma through `context.prisma`,
 * which is injected by the context factory (`app/context.ts`). This ensures
 * the client is mockable in tests and consistent across the request lifecycle.
 *
 * **Direct imports** (`import { prisma } from '~/lib/prisma'`) should be
 * limited to:
 *   - Process startup / shutdown (`app/server.ts`, `app/context.ts`)
 *   - CLI scripts and seeds (`scripts/`)
 *
 * Importing the singleton directly in a resolver bypasses the factory and
 * makes the client impossible to inject or mock in unit tests.
 *
 * @see app/context.ts  — Context factory that injects prisma into resolvers
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

// Load environment variables before constructing PrismaClient so that
// DATABASE_URL from .env is visible even when this module is imported
// before dotenv.config() runs in server.ts.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Extend globalThis for development hot-reload caching
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Shared Prisma Client instance.
 * - In production: creates a single instance per process.
 * - In development: reuses instance across hot-reloads via globalThis.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma Client.
 * Call during application shutdown (SIGINT/SIGTERM handlers).
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

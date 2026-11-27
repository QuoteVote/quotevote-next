/**
 * Usernames are saved in lowercase, as legacy always did (#748). Legacy's model lowercases
 * and trims every username, so "Alex" and "alex" are the same account there; the 2.0
 * backend kept capitals, which let "Alex" be created next to "alex".
 */
import type { PrismaClient } from '@prisma/client';
import { escapeRegExp } from '~/data/resolvers/utils/common';

/** The form a username is saved in: trimmed and lowercase. */
export const normalizeUsername = (raw: string): string => raw.trim().toLowerCase();

/**
 * The account already using this username, ignoring capitals, or null. Accounts created
 * before usernames were lowercased may still have capitals, so this isn't a plain
 * equality check. Prisma turns a case-insensitive `equals` into an anchored MongoDB regex
 * without escaping it, so the name is escaped here.
 */
export const findUsernameOwner = (
  prisma: Pick<PrismaClient, 'user'>,
  username: string,
  excludeUserId?: string
): Promise<{ id: string } | null> =>
  prisma.user.findFirst({
    where: {
      username: { equals: escapeRegExp(normalizeUsername(username)), mode: 'insensitive' },
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true },
  });

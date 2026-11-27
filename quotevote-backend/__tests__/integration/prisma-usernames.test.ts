/**
 * Username duplicates ignoring capitals, against a real MongoDB (#748).
 *
 * Prisma turns a case-insensitive `equals` into an anchored regex without escaping it, so
 * this checks on the real database that capitals are ignored and that a name is never
 * treated as a pattern.
 *
 * Requires a MongoDB replica set in DATABASE_URL. Use a throwaway database: the test drops
 * the documents it creates and nothing else.
 *
 * Run: pnpm test:prisma
 */
import { PrismaClient } from '@prisma/client';
import { findUsernameOwner } from '~/data/utils/usernames';

const prisma = new PrismaClient();
const EMAIL_SUFFIX = '@usernames-748.test';

const removeTestUsers = () =>
  prisma.$runCommandRaw({
    delete: 'users',
    deletes: [{ q: { email: { $regex: `${EMAIL_SUFFIX.replace('.', '\\.')}$` } }, limit: 0 }],
  });

let mixedCaseId: string;

beforeAll(async () => {
  await removeTestUsers();
  // As saved by the 2.0 backend before usernames were lowercased, and by legacy.
  await prisma.$runCommandRaw({
    insert: 'users',
    documents: [
      {
        username: 'Usr748Mixed',
        email: `mixed${EMAIL_SUFFIX}`,
        _followingId: [],
        _followersId: [],
      },
      { username: 'usr748.dot', email: `dot${EMAIL_SUFFIX}`, _followingId: [], _followersId: [] },
      {
        username: 'usr748longname',
        email: `long${EMAIL_SUFFIX}`,
        _followingId: [],
        _followersId: [],
      },
    ],
  });
  mixedCaseId = (await prisma.user.findFirst({
    where: { username: 'Usr748Mixed' },
    select: { id: true },
  }))!.id;
});

afterAll(async () => {
  await removeTestUsers();
  await prisma.$disconnect();
});

describe('findUsernameOwner on MongoDB (#748)', () => {
  it('finds a username saved with capitals, whatever capitals are typed', async () => {
    for (const typed of ['usr748mixed', 'USR748MIXED', ' Usr748mixed ']) {
      await expect(findUsernameOwner(prisma, typed)).resolves.toEqual({ id: mixedCaseId });
    }
  });

  it('leaves out the account making the change', async () => {
    await expect(findUsernameOwner(prisma, 'usr748mixed', mixedCaseId)).resolves.toBeNull();
  });

  it('never treats the name as a pattern', async () => {
    await expect(findUsernameOwner(prisma, 'usr748long.*')).resolves.toBeNull();
    await expect(findUsernameOwner(prisma, 'usr748xdot')).resolves.toBeNull();
    await expect(findUsernameOwner(prisma, 'usr748.dot')).resolves.not.toBeNull();
  });

  it('matches the whole name, not a prefix', async () => {
    await expect(findUsernameOwner(prisma, 'usr748long')).resolves.toBeNull();
  });
});

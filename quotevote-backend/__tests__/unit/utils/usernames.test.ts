/** Usernames are saved in lowercase and checked for duplicates ignoring capitals (#748). */
import { findUsernameOwner, normalizeUsername } from '~/data/utils/usernames';

describe('normalizeUsername', () => {
  it('trims and lowercases, as legacy saves usernames', () => {
    expect(normalizeUsername('  Alex_R ')).toBe('alex_r');
  });
});

describe('findUsernameOwner', () => {
  const prismaWith = () => ({ user: { findFirst: jest.fn().mockResolvedValue(null) } });

  it('matches ignoring capitals, with the name escaped so it is never a pattern', async () => {
    const prisma = prismaWith();
    await findUsernameOwner(prisma as never, 'Long.*', 'self-id');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        username: { equals: 'long\\.\\*', mode: 'insensitive' },
        NOT: { id: 'self-id' },
      },
      select: { id: true },
    });
  });

  it('checks every account when there is no one to leave out', async () => {
    const prisma = prismaWith();
    await findUsernameOwner(prisma as never, 'alex');

    expect(prisma.user.findFirst.mock.calls[0][0].where).toEqual({
      username: { equals: 'alex', mode: 'insensitive' },
    });
  });
});

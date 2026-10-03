import { createWsContext } from '~/context';
import * as authentication from '~/data/utils/authentication';

describe('createWsContext', () => {
  it('hydrates an authenticated user from connection parameters', async () => {
    jest
      .spyOn(authentication, 'verifyToken')
      .mockResolvedValue({ userId: 'user-1', username: 'user', email: 'user@example.com' });
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          username: 'user',
          name: 'User',
          avatar: null,
          bio: null,
          isAdmin: false,
          accountStatus: 'active',
          followingIds: [],
          followerIds: [],
          reputation: 0,
        }),
      },
    };

    const context = await createWsContext(
      { authToken: 'Bearer token-1' },
      { prisma: prisma as never }
    );

    expect(authentication.verifyToken).toHaveBeenCalledWith('token-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
    expect(context.userId).toBe('user-1');
    expect(context.connectionParams).toEqual({ authToken: 'Bearer token-1' });
    expect(context.requestId).toEqual(expect.any(String));
  });

  it('keeps invalid connection tokens unauthenticated', async () => {
    jest.spyOn(authentication, 'verifyToken').mockRejectedValue(new Error('invalid token'));

    const context = await createWsContext({ authToken: 'invalid' }, { prisma: {} as never });

    expect(context.user).toBeNull();
    expect(context.userId).toBeNull();
  });
});

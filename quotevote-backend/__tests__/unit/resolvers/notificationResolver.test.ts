import Notification from '~/data/models/Notification';
import { notificationResolver } from '~/data/resolvers/notificationResolver';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/models/Notification');

const userId = '60d5ec49ad414d7a8d5464a0';

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
  };
}

describe('notificationResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.notifications', () => {
    it('requires authentication', async () => {
      await expect(
        notificationResolver.Query.notifications(null, {}, mockContext(null))
      ).rejects.toThrow(/Authentication required/);
    });

    it('returns an empty list when the user has no notifications', async () => {
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await notificationResolver.Query.notifications(
        null,
        {},
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(Notification.find).toHaveBeenCalledWith({
        userId,
        status: 'new',
      });
      expect(result).toEqual([]);
    });
  });
});

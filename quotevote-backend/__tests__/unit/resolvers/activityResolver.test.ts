import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { activityResolver } from '~/data/resolvers/activityResolver';
import Activity from '~/data/models/Activity';
import User from '~/data/models/User';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/models/Activity');
jest.mock('~/data/models/User');

const actorId = '60d5ec49ad414d7a8d5464a0';
const profileId = '60d5ec49ad414d7a8d5464a1';

function mockContext(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: {
      _id: actorId,
      username: 'alice',
      email: 'alice@example.com',
      admin: false,
      ...overrides,
    } as NonNullable<GraphQLContext['user']>,
  };
}

describe('activityResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.activities', () => {
    it('requires authentication', async () => {
      await expect(
        activityResolver.Query.activities(
          null,
          {
            user_id: profileId,
            limit: 10,
            offset: 0,
            searchKey: '',
            activityEvent: ['VOTED'],
          },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('returns paginated activities for a user', async () => {
      const activityId = new mongoose.Types.ObjectId();
      (Activity.countDocuments as jest.Mock).mockResolvedValue(1);
      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: activityId,
                  userId: new mongoose.Types.ObjectId(profileId),
                  postId: new mongoose.Types.ObjectId(),
                  activityType: 'VOTED',
                  content: 'voted',
                  created: new Date('2024-01-01T00:00:00Z'),
                },
              ]),
            }),
          }),
        }),
      });

      const result = await activityResolver.Query.activities(
        null,
        {
          user_id: profileId,
          limit: 15,
          offset: 0,
          searchKey: '',
          activityEvent: ['VOTED'],
        },
        mockContext()
      );

      expect(Activity.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: profileId,
          activityType: { $in: ['VOTED'] },
        })
      );
      expect(result.pagination).toEqual({ total_count: 1, limit: 15, offset: 0 });
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].activityType).toBe('VOTED');
      expect(result.entities[0]._id).toBe(activityId.toString());
    });

    it('falls back to following feed when user_id is omitted', async () => {
      const followingId = '60d5ec49ad414d7a8d5464a2';
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _followingId: [new mongoose.Types.ObjectId(followingId)],
          }),
        }),
      });
      (Activity.countDocuments as jest.Mock).mockResolvedValue(0);
      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await activityResolver.Query.activities(
        null,
        {
          user_id: '',
          limit: 10,
          offset: 0,
          searchKey: '',
          activityEvent: [],
        },
        mockContext()
      );

      expect(Activity.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: { $in: [followingId] },
        })
      );
    });
  });
});

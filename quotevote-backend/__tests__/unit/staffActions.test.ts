import { recordStaffAction } from '~/data/utils/staffActions';
import { logger } from '~/data/utils/logger';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const adminId = '507f1f77bcf86cd799439011';
const targetId = '507f1f77bcf86cd799439012';

function contextWith(user: GraphQLContext['user'], create = jest.fn().mockResolvedValue({})) {
  return {
    context: { user, prisma: { staffAction: { create } } } as unknown as GraphQLContext,
    create,
  };
}

describe('recordStaffAction (#616)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records the actor, action, target and detail', async () => {
    const { context, create } = contextWith({
      _id: adminId,
      admin: true,
    } as GraphQLContext['user']);

    await recordStaffAction(context, 'role_granted', targetId, 'moderator');

    expect(create).toHaveBeenCalledWith({
      data: { actorId: adminId, action: 'role_granted', targetId, detail: 'moderator' },
      select: { id: true },
    });
  });

  it('stores no detail when none is given', async () => {
    const { context, create } = contextWith({
      _id: adminId,
      admin: true,
    } as GraphQLContext['user']);

    await recordStaffAction(context, 'invite_approved', targetId);

    expect(create.mock.calls[0][0].data.detail).toBeNull();
  });

  it('records nothing without a signed-in actor', async () => {
    const { context, create } = contextWith(null);

    await recordStaffAction(context, 'user_disabled', targetId);

    expect(create).not.toHaveBeenCalled();
  });

  it('logs a failed write instead of failing the mutation', async () => {
    const { context } = contextWith(
      { _id: adminId, admin: true } as GraphQLContext['user'],
      jest.fn().mockRejectedValue(new Error('db down'))
    );

    await expect(recordStaffAction(context, 'user_enabled', targetId)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'Could not record a staff action',
      expect.objectContaining({ action: 'user_enabled', actorId: adminId, error: 'db down' })
    );
  });
});

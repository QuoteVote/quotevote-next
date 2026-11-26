import type { PrismaClient } from '@prisma/client';
import { MESSAGE_ROOM_SELECT } from '~/data/resolvers/utils/chatRooms';
import { addUserToPostRoom } from '~/data/resolvers/utils/messages';

type PrismaMock = {
  message: {
    findMany: jest.Mock;
  };
  messageRoom: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
};

const createPrismaMock = (): PrismaMock => ({
  message: {
    findMany: jest.fn(),
  },
  messageRoom: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('messages resolver utilities', () => {
  it('creates a post room when one does not exist', async () => {
    const prisma = createPrismaMock();
    const room = { id: 'room-new', userIds: ['user1'] };
    prisma.messageRoom.findFirst.mockResolvedValue(null);
    prisma.messageRoom.create.mockResolvedValue(room);

    await expect(
      addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1')
    ).resolves.toEqual(room);
    expect(prisma.messageRoom.findFirst).toHaveBeenCalledWith({
      where: { postId: 'post1', messageType: 'POST' },
      orderBy: { id: 'asc' },
      select: MESSAGE_ROOM_SELECT,
    });
    expect(prisma.messageRoom.create).toHaveBeenCalledWith({
      data: {
        userIds: ['user1'],
        postId: 'post1',
        messageType: 'POST',
        lastActivity: expect.any(Date),
      },
      select: MESSAGE_ROOM_SELECT,
    });
  });

  it('joins the older room when another request created one at the same moment (#790)', async () => {
    const prisma = createPrismaMock();
    const older = { id: 'room-older', userIds: ['user2'] };
    const mine = { id: 'room-mine', userIds: ['user1'] };
    prisma.messageRoom.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(older);
    prisma.messageRoom.create.mockResolvedValue(mine);
    prisma.messageRoom.deleteMany.mockResolvedValue({ count: 1 });
    prisma.messageRoom.updateMany.mockResolvedValue({ count: 1 });

    const room = await addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1');

    expect(prisma.messageRoom.deleteMany).toHaveBeenCalledWith({ where: { id: 'room-mine' } });
    expect(prisma.messageRoom.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'room-older', NOT: { userIds: { has: 'user1' } } } })
    );
    expect(room).toMatchObject({ id: 'room-older', userIds: ['user2', 'user1'] });
  });

  it('keeps its own room when it is the oldest', async () => {
    const prisma = createPrismaMock();
    const mine = { id: 'room-mine', userIds: ['user1'] };
    prisma.messageRoom.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(mine);
    prisma.messageRoom.create.mockResolvedValue(mine);

    await expect(
      addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1')
    ).resolves.toEqual(mine);
    expect(prisma.messageRoom.deleteMany).not.toHaveBeenCalled();
  });

  it('adds a user and updates activity for an existing room', async () => {
    const prisma = createPrismaMock();
    const existingRoom = { id: 'room1', userIds: ['other-user'] };
    prisma.messageRoom.findFirst.mockResolvedValue(existingRoom);
    prisma.messageRoom.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1')
    ).resolves.toEqual({
      ...existingRoom,
      userIds: ['other-user', 'user1'],
      lastActivity: expect.any(Date),
    });
    // Legacy rooms have no createdAt, so the room is never read back.
    expect(prisma.messageRoom.findUnique).not.toHaveBeenCalled();
    expect(prisma.messageRoom.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'room1',
        NOT: { userIds: { has: 'user1' } },
      },
      data: {
        userIds: { push: 'user1' },
        lastActivity: expect.any(Date),
      },
    });
  });

  it('does not duplicate an existing room member', async () => {
    const prisma = createPrismaMock();
    const existingRoom = { id: 'room1', userIds: ['user1'] };
    prisma.messageRoom.findFirst.mockResolvedValue(existingRoom);
    prisma.messageRoom.updateMany.mockResolvedValue({ count: 0 });

    const room = await addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1');

    expect(room.userIds).toEqual(['user1']);
    expect(prisma.messageRoom.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'room1' },
      data: {
        lastActivity: expect.any(Date),
      },
    });
  });
});

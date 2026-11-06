import type { PrismaClient } from '@prisma/client';
import { MESSAGE_ROOM_SELECT } from '~/data/resolvers/utils/chatRooms';
import { addUserToPostRoom, getMessages, getUnreadMessages } from '~/data/resolvers/utils/messages';

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
  },
});

describe('messages resolver utilities', () => {
  it('gets non-deleted messages for a room', async () => {
    const prisma = createPrismaMock();
    const messages = [{ id: 'm1', text: 'hello' }];
    prisma.message.findMany.mockResolvedValue(messages);

    await expect(getMessages(prisma as unknown as PrismaClient, 'room1')).resolves.toEqual(
      messages
    );
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'room1', deleted: false },
    });
  });

  it('gets unread messages excluding the current user and read messages', async () => {
    const prisma = createPrismaMock();
    const unread = [{ id: 'm1', text: 'new message' }];
    prisma.message.findMany.mockResolvedValue(unread);

    await expect(
      getUnreadMessages(prisma as unknown as PrismaClient, 'room1', 'user1')
    ).resolves.toEqual(unread);
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        messageRoomId: 'room1',
        userId: { not: 'user1' },
        NOT: { readBy: { has: 'user1' } },
        deleted: false,
      },
    });
  });

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

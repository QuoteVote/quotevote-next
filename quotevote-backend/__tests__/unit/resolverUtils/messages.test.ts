import type { PrismaClient } from '@prisma/client';
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
    });
    expect(prisma.messageRoom.create).toHaveBeenCalledWith({
      data: {
        userIds: ['user1'],
        postId: 'post1',
        messageType: 'POST',
        lastActivity: expect.any(Date),
      },
    });
  });

  it('adds a user and updates activity for an existing room', async () => {
    const prisma = createPrismaMock();
    const existingRoom = { id: 'room1', userIds: ['other-user'] };
    const updatedRoom = { ...existingRoom, userIds: ['other-user', 'user1'] };
    prisma.messageRoom.findFirst.mockResolvedValue(existingRoom);
    prisma.messageRoom.updateMany.mockResolvedValue({ count: 1 });
    prisma.messageRoom.findUnique.mockResolvedValue(updatedRoom);

    await expect(
      addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1')
    ).resolves.toEqual(updatedRoom);
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
    prisma.messageRoom.findUnique.mockResolvedValue(existingRoom);
    prisma.messageRoom.update.mockResolvedValue(existingRoom);

    await addUserToPostRoom(prisma as unknown as PrismaClient, 'post1', 'user1');

    expect(prisma.messageRoom.update).toHaveBeenCalledWith({
      where: { id: 'room1' },
      data: {
        lastActivity: expect.any(Date),
      },
    });
  });
});

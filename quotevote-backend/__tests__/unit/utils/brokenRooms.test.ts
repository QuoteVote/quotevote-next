import { BROKEN_ROOM_FILTER, summarizeBrokenRooms } from '~/data/utils/brokenRooms';

function mockPrisma(rows: unknown[], groups: unknown[] = []) {
  return {
    messageRoom: { findRaw: jest.fn().mockResolvedValue(rows) },
    message: { groupBy: jest.fn().mockResolvedValue(groups) },
  };
}

describe('summarizeBrokenRooms (#713)', () => {
  it('counts rooms with an empty member by type, and the messages in them', async () => {
    const prisma = mockPrisma(
      [
        { _id: { $oid: 'room-1' }, messageType: 'USER' },
        { _id: { $oid: 'room-2' }, messageType: 'USER' },
        { _id: { $oid: 'room-3' } },
      ],
      [
        { messageRoomId: 'room-1', _count: { _all: 2 } },
        { messageRoomId: 'room-3', _count: { _all: 1 } },
      ]
    );

    await expect(summarizeBrokenRooms(prisma as never)).resolves.toEqual({
      rooms: 3,
      byType: { USER: 2, unknown: 1 },
      withMessages: 2,
      messages: 3,
    });
    expect(prisma.messageRoom.findRaw).toHaveBeenCalledWith({
      filter: BROKEN_ROOM_FILTER,
      options: { projection: { _id: 1, messageType: 1 } },
    });
    expect(prisma.message.groupBy).toHaveBeenCalledWith({
      by: ['messageRoomId'],
      where: { messageRoomId: { in: ['room-1', 'room-2', 'room-3'] } },
      _count: { _all: true },
    });
  });

  it('only matches rooms whose users field exists and holds a null', () => {
    expect(BROKEN_ROOM_FILTER).toEqual({
      $and: [{ users: { $exists: true } }, { users: null }],
    });
  });

  it('reports zero without reading messages when there are none', async () => {
    const prisma = mockPrisma([]);

    await expect(summarizeBrokenRooms(prisma as never)).resolves.toEqual({
      rooms: 0,
      byType: {},
      withMessages: 0,
      messages: 0,
    });
    expect(prisma.message.groupBy).not.toHaveBeenCalled();
  });
});

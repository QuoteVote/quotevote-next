import { graphql } from 'graphql';
import { schema } from '~/data/schema';

const source = `
  query {
    found: searchMessages(text: "hall", limit: 5) {
      results { ...HitFields }
      nextCursor
    }
  }
  fragment HitFields on MessageSearchHit {
    _id
    snippet
    user { username }
  }
`;

const roomId = '507f1f77bcf86cd799439021';
const authorId = '507f1f77bcf86cd799439022';

function buildContext(userId: string | null) {
  const roomFindMany = jest.fn().mockResolvedValue([{ id: roomId }]);
  const messageFindMany = jest.fn().mockResolvedValue([
    {
      id: '507f1f77bcf86cd7994390a1',
      messageRoomId: roomId,
      userId: authorId,
      text: 'See you at the town hall tonight',
      created: new Date('2026-01-01T00:00:00.000Z'),
      deleted: false,
    },
  ]);
  const userFindMany = jest
    .fn()
    .mockResolvedValue([{ id: authorId, username: 'bob', name: 'Bob' }]);

  return {
    roomFindMany,
    messageFindMany,
    contextValue: {
      user: userId ? { _id: userId } : null,
      userId,
      prisma: {
        messageRoom: { findMany: roomFindMany },
        message: { findMany: messageFindMany },
        user: { findMany: userFindMany },
      },
    },
  };
}

describe('searchMessages (executable schema)', () => {
  it('rejects a signed-out caller without reading anything', async () => {
    const { roomFindMany, messageFindMany, contextValue } = buildContext(null);

    const result = await graphql({ schema, source, contextValue });

    expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    expect(result.data).toEqual({ found: null });
    expect(roomFindMany).not.toHaveBeenCalled();
    expect(messageFindMany).not.toHaveBeenCalled();
  });

  it('returns hits with a snippet and the public author for a member', async () => {
    const { contextValue } = buildContext('507f1f77bcf86cd799439031');

    const result = await graphql({ schema, source, contextValue });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      found: {
        results: [
          {
            _id: '507f1f77bcf86cd7994390a1',
            snippet: 'See you at the town hall tonight',
            user: { username: 'bob' },
          },
        ],
        nextCursor: null,
      },
    });
  });
});

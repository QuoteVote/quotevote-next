import { groupIdsByPost } from '~/data/resolvers/utils/batchLoad';
import { toPublicPresence } from '~/data/resolvers/heartbeatResolver';

describe('groupIdsByPost', () => {
  it('groups live rows by post and skips rows with no post or deleted', () => {
    const byPost = groupIdsByPost([
      { id: 'a', postId: 'p1' },
      { id: 'b', postId: 'p1', deleted: false },
      { id: 'c', postId: 'p2', deleted: true },
      { id: 'd', postId: null },
    ]);

    expect([...byPost.entries()]).toEqual([['p1', [{ _id: 'a' }, { _id: 'b' }]]]);
  });
});

describe('toPublicPresence', () => {
  it('leaves a missing heartbeat out instead of passing null through', () => {
    expect(
      toPublicPresence({
        id: 'x',
        userId: 'u',
        status: 'online',
        statusMessage: null,
        lastHeartbeat: null,
        lastSeen: null,
      })
    ).toEqual({
      _id: 'x',
      userId: 'u',
      status: 'online',
      statusMessage: undefined,
      lastHeartbeat: undefined,
      lastSeen: undefined,
    });
  });
});

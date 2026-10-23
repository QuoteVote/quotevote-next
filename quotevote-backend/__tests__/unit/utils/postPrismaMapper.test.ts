/**
 * Unit tests for the Prisma → GraphQL Post mapper.
 */

import {
  POST_RECORD_SELECT,
  normalizeVotedBy,
  toGraphQLPost,
  type PrismaPostRecord,
} from '~/data/utils/postPrismaMapper';

function basePost(overrides: Partial<PrismaPostRecord> = {}): PrismaPostRecord {
  return {
    id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    tagId: '507f1f77bcf86cd799439013',
    title: 'A title',
    text: 'A body',
    created: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('postPrismaMapper.toGraphQLPost', () => {
  it('maps Prisma id → _id and enableVoting → enable_voting', () => {
    const result = toGraphQLPost(basePost({ enableVoting: true }));
    expect(result._id).toBe('507f1f77bcf86cd799439011');
    expect(result.tagId).toBe('507f1f77bcf86cd799439013');
    expect(result.enable_voting).toBe(true);
  });

  it('defaults votedBy to an empty array and attaches creator', () => {
    const result = toGraphQLPost(basePost({ votedBy: undefined }), {
      id: '507f1f77bcf86cd799439012',
      username: 'alice',
      name: 'Alice',
    });
    expect(result.votedBy).toEqual([]);
    expect(result.creator).toMatchObject({
      _id: '507f1f77bcf86cd799439012',
      username: 'alice',
    });
  });

  it('omits legacy timestamp columns from the post select', () => {
    expect(POST_RECORD_SELECT).not.toHaveProperty('createdAt');
    expect(POST_RECORD_SELECT).not.toHaveProperty('updatedAt');
    expect(POST_RECORD_SELECT).toMatchObject({ id: true, tagId: true, enableVoting: true });
  });

  it('sets creator to null when no author is provided', () => {
    const result = toGraphQLPost(basePost());
    expect(result.creator).toBeNull();
  });
});

describe('postPrismaMapper.normalizeVotedBy', () => {
  it('reads legacy { type, userId } objects as user ids, the way the legacy API returns them', () => {
    expect(
      normalizeVotedBy([
        { type: 'up', userId: { $oid: '507f1f77bcf86cd799439012' } },
        { type: 'down', userId: '507f1f77bcf86cd799439014' },
      ])
    ).toEqual(['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439014']);
  });

  it('keeps plain ids, including ObjectIds read through Json', () => {
    expect(normalizeVotedBy(['a1', { $oid: 'b2' }])).toEqual(['a1', 'b2']);
  });

  it('returns an empty list for a missing field or unreadable entries', () => {
    expect(normalizeVotedBy(null)).toEqual([]);
    expect(normalizeVotedBy(undefined)).toEqual([]);
    expect(normalizeVotedBy('not-a-list')).toEqual([]);
    expect(normalizeVotedBy([null, 7, { type: 'up' }, { userId: null }])).toEqual([]);
  });

  it('maps legacy votedBy through toGraphQLPost', () => {
    const result = toGraphQLPost(basePost({ votedBy: [{ type: 'up', userId: 'u9' }] }));
    expect(result.votedBy).toEqual(['u9']);
  });
});

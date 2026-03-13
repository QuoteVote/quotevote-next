/**
 * Test suite for score resolver utilities.
 */

import Vote from '~/data/models/Vote';
import User from '~/data/models/User';
import {
  scoreUtil,
  voteTypeUtil,
  upvotes,
  downvotes,
  topUsers,
} from '~/data/resolvers/utils/scores';

jest.mock('~/data/models/Vote', () => ({
  find: jest.fn(),
}));

jest.mock('~/data/models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('scores resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreUtil', () => {
    it('should calculate net score from mixed votes', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'up' },
        { type: 'down' },
      ]);

      const result = await scoreUtil({ user_id: 'user1' });
      expect(result).toBe(1); // 2 ups (+2) - 1 down (-1) = 1
    });

    it('should return 0 for no votes', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([]);

      const result = await scoreUtil({});
      expect(result).toBe(0);
    });

    it('should build filter with song_id and artist_id', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([]);

      await scoreUtil({ song_id: 'song1', artist_id: 'artist1' });
      expect(Vote.find).toHaveBeenCalledWith({
        _songId: 'song1',
        _artistId: 'artist1',
      });
    });
  });

  describe('voteTypeUtil', () => {
    it('should filter by upvotes when vote_type is true', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'up' },
      ]);

      const result = await voteTypeUtil({ vote_type: true });
      expect(result).toBe(2);
      expect(Vote.find).toHaveBeenCalledWith(expect.objectContaining({ type: 'up' }));
    });

    it('should filter by downvotes when vote_type is false', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([
        { type: 'down' },
      ]);

      const result = await voteTypeUtil({ vote_type: false });
      expect(result).toBe(-1);
      expect(Vote.find).toHaveBeenCalledWith(expect.objectContaining({ type: 'down' }));
    });
  });

  describe('upvotes', () => {
    it('should count upvotes matching the filter', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([{ type: 'up' }, { type: 'up' }]);

      const result = await upvotes({ user_id: 'user1' });
      expect(result).toBe(2);
      expect(Vote.find).toHaveBeenCalledWith({ userId: 'user1', type: 'up' });
    });

    it('should return 0 for no upvotes', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([]);

      const result = await upvotes({});
      expect(result).toBe(0);
    });
  });

  describe('downvotes', () => {
    it('should count downvotes matching the filter', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([{ type: 'down' }]);

      const result = await downvotes({ user_id: 'user1' });
      expect(result).toBe(1);
      expect(Vote.find).toHaveBeenCalledWith({ userId: 'user1', type: 'down' });
    });
  });

  describe('topUsers', () => {
    it('should return top users sorted by net vote score', async () => {
      (User.find as jest.Mock).mockResolvedValue([
        { _id: 'u1' },
        { _id: 'u2' },
        { _id: 'u3' },
      ]);

      (Vote.find as jest.Mock)
        .mockResolvedValueOnce([{ type: 'up' }, { type: 'up' }])   // u1: +2
        .mockResolvedValueOnce([{ type: 'down' }])                  // u2: -1
        .mockResolvedValueOnce([{ type: 'up' }, { type: 'up' }, { type: 'up' }]); // u3: +3

      (User.findById as jest.Mock)
        .mockResolvedValueOnce({ username: 'alice' })
        .mockResolvedValueOnce({ username: 'bob' })
        .mockResolvedValueOnce({ username: 'charlie' });

      const result = await topUsers(2);

      expect(result).toHaveLength(2);
      expect(result[0].user).toBe('charlie'); // score 3
      expect(result[1].user).toBe('alice');   // score 2
    });

    it('should show "unknown" for users without a username', async () => {
      (User.find as jest.Mock).mockResolvedValue([{ _id: 'u1' }]);
      (Vote.find as jest.Mock).mockResolvedValue([]);
      (User.findById as jest.Mock).mockResolvedValue(null);

      const result = await topUsers(10);
      expect(result[0].user).toBe('unknown');
    });
  });
});

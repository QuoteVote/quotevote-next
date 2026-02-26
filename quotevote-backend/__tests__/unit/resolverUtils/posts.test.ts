/**
 * Test suite for post resolver utilities.
 */

import Post from '~/data/models/Post';
import { updateTrending } from '~/data/resolvers/utils/posts';

jest.mock('~/data/models/Post', () => ({
  findById: jest.fn(),
  updateOne: jest.fn().mockResolvedValue({}),
}));

describe('posts resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTrending', () => {
    it('should do nothing if post is not found', async () => {
      (Post.findById as jest.Mock).mockResolvedValue(null);

      await updateTrending('nonexistent');

      expect(Post.findById).toHaveBeenCalledWith('nonexistent');
      expect(Post.updateOne).not.toHaveBeenCalled();
    });

    it('should increment dayPoints if pointTimestamp is within 24 hours', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago

      (Post.findById as jest.Mock).mockResolvedValue({
        _id: 'post1',
        pointTimestamp: recentDate,
        dayPoints: 5,
      });

      await updateTrending('post1');

      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: 'post1' },
        {
          $set: {
            pointTimestamp: expect.any(Date),
            dayPoints: 6,
          },
        }
      );
    });

    it('should reset dayPoints to 1 if pointTimestamp is older than 24 hours', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

      (Post.findById as jest.Mock).mockResolvedValue({
        _id: 'post2',
        pointTimestamp: oldDate,
        dayPoints: 100,
      });

      await updateTrending('post2');

      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: 'post2' },
        {
          $set: {
            pointTimestamp: expect.any(Date),
            dayPoints: 1,
          },
        }
      );
    });

    it('should reset dayPoints when pointTimestamp is not a Date', async () => {
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: 'post3',
        pointTimestamp: 'not-a-date',
        dayPoints: 10,
      });

      await updateTrending('post3');

      // pointTimestamp is not instanceof Date, so isWithin24hrs is false → reset path
      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: 'post3' },
        {
          $set: {
            pointTimestamp: expect.any(Date),
            dayPoints: 1,
          },
        }
      );
    });

    it('should handle post with no existing dayPoints (null/undefined)', async () => {
      const recentDate = new Date();

      (Post.findById as jest.Mock).mockResolvedValue({
        _id: 'post4',
        pointTimestamp: recentDate,
        dayPoints: undefined,
      });

      await updateTrending('post4');

      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: 'post4' },
        {
          $set: {
            pointTimestamp: expect.any(Date),
            dayPoints: 1, // (undefined ?? 0) + 1
          },
        }
      );
    });
  });
});

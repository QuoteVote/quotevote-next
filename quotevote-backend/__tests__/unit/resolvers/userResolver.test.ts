import mongoose from 'mongoose';
import { userResolver } from '~/data/resolvers/userResolver';
import User from '~/data/models/User';

jest.mock('~/data/models/User');

describe('userResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.searchUser', () => {
    it('returns an empty array early if queryName is empty or whitespace only', async () => {
      const resultEmpty = await userResolver.Query.searchUser(null, { queryName: '' });
      const resultWhitespace = await userResolver.Query.searchUser(null, { queryName: '   ' });

      expect(resultEmpty).toEqual([]);
      expect(resultWhitespace).toEqual([]);
      expect(User.find).not.toHaveBeenCalled();
    });

    it('escapes special regex characters to prevent injection', async () => {
      (User.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464a0'),
              name: 'Alice Cooper',
              username: 'alice',
              accountStatus: 'active',
            },
          ]),
        }),
      });

      const result = await userResolver.Query.searchUser(null, { queryName: '@.*' });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { name: expect.any(RegExp) },
            { username: expect.any(RegExp) },
          ],
          accountStatus: 'active',
        })
      );

      // Verify that the regex matches the escaped pattern
      const callArg = (User.find as jest.Mock).mock.calls[0][0];
      const nameRegex = callArg.$or[0].name;
      expect(nameRegex.source).toBe('@\\.\\*');
      expect(nameRegex.flags).toBe('i');

      expect(result).toEqual([
        {
          _id: '60d5ec49ad414d7a8d5464a0',
          name: 'Alice Cooper',
          username: 'alice',
          accountStatus: 'active',
        },
      ]);
    });
  });
});

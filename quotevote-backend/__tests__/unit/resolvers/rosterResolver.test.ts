import mongoose from 'mongoose';
import { rosterResolver } from '~/data/resolvers/rosterResolver';
import Roster from '~/data/models/Roster';
import User from '~/data/models/User';

jest.mock('~/data/models/Roster');
jest.mock('~/data/models/User');

describe('rosterResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.getRoster', () => {
    it('returns empty array if context.userId is missing', async () => {
      const result = await rosterResolver.Query.getRoster(null, {}, {});
      expect(result).toEqual([]);
      expect(Roster.find).not.toHaveBeenCalled();
    });

    it('returns roster entries with buddy details resolved', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockBuddyId = new mongoose.Types.ObjectId();
      const mockRosterId = new mongoose.Types.ObjectId();

      const mockRosterEntry = {
        _id: mockRosterId,
        userId: new mongoose.Types.ObjectId(mockUserId),
        buddyId: mockBuddyId,
        initiatedBy: new mongoose.Types.ObjectId(mockUserId),
      };

      (Roster.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRosterEntry]),
      });

      (User.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: mockBuddyId,
            name: 'Bob',
            username: 'bob',
          },
        ]),
      });

      const result = await rosterResolver.Query.getRoster(null, {}, { userId: mockUserId });

      expect(User.find).toHaveBeenCalledWith({ _id: { $in: [mockBuddyId.toString()] } });
      expect(result).toHaveLength(1);
      expect(result[0].buddy.name).toBe('Bob');
      expect(result[0]._id).toBe(mockRosterId.toString());
    });
  });
});

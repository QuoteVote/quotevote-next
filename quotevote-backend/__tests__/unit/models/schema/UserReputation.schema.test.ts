import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import UserReputation from '~/data/models/UserReputation';

describe('UserReputation Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new UserReputation();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new UserReputation({ userId: createObjectId() });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default score values to 0', () => {
      const doc = new UserReputation({ userId: createObjectId() });
      expect(doc.overallScore).toBe(0);
      expect(doc.inviteNetworkScore).toBe(0);
      expect(doc.conductScore).toBe(0);
      expect(doc.activityScore).toBe(0);
    });

    it('should set default metric values to 0', () => {
      const doc = new UserReputation({ userId: createObjectId() });
      expect(doc.metrics.totalInvitesSent).toBe(0);
      expect(doc.metrics.totalInvitesAccepted).toBe(0);
      expect(doc.metrics.totalInvitesDeclined).toBe(0);
      expect(doc.metrics.averageInviteeReputation).toBe(0);
      expect(doc.metrics.totalReportsReceived).toBe(0);
      expect(doc.metrics.totalReportsResolved).toBe(0);
      expect(doc.metrics.totalUpvotes).toBe(0);
      expect(doc.metrics.totalDownvotes).toBe(0);
      expect(doc.metrics.totalPosts).toBe(0);
      expect(doc.metrics.totalComments).toBe(0);
    });

    it('should set default lastCalculated date', () => {
      const doc = new UserReputation({ userId: createObjectId() });
      expect(doc.lastCalculated).toBeInstanceOf(Date);
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should use findOne', async () => {
      const userId = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(UserReputation, 'findOne').mockResolvedValue(null);

      await UserReputation.findByUserId(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ userId });
      findOneSpy.mockRestore();
    });

    it('calculateScore should call reputation util and findOneAndUpdate', async () => {
      const userId = createObjectId().toHexString();
      const mockReputationData = {
        overallScore: 100,
        inviteNetworkScore: 50,
        conductScore: 30,
        activityScore: 20,
        metrics: {
          totalInvitesSent: 5,
          totalInvitesAccepted: 3,
          totalInvitesDeclined: 1,
          averageInviteeReputation: 200,
          totalReportsReceived: 0,
          totalReportsResolved: 0,
          totalUpvotes: 10,
          totalDownvotes: 2,
          totalPosts: 8,
          totalComments: 15,
        },
        lastCalculated: new Date(),
      };

      // Mock the dynamic import
      jest.mock('~/data/resolvers/utils/reputation', () => ({
        calculateUserReputation: jest.fn().mockResolvedValue(mockReputationData),
      }), { virtual: true });

      const findOneAndUpdateSpy = jest
        .spyOn(UserReputation, 'findOneAndUpdate')
        .mockResolvedValue(null);

      await UserReputation.calculateScore(userId);

      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { userId },
        expect.objectContaining({
          overallScore: 100,
          inviteNetworkScore: 50,
        }),
        expect.objectContaining({ upsert: true, new: true })
      );

      findOneAndUpdateSpy.mockRestore();
    });
  });
});

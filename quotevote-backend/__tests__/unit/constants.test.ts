/**
 * Test suite for system-wide constants and event definitions.
 */

import * as constants from '../../app/data/utils/constants';

/**
 * Constants and SubscriptionEvents Utility Tests.
 */
describe('constants utility', () => {
  describe('SubscriptionEvents', () => {
    it('should have all required event types', () => {
      expect(constants.SubscriptionEvents).toEqual({
        MESSAGE_CREATED: 'MESSAGE_CREATED',
        USER_MESSAGE_CREATED: 'USER_MESSAGE_CREATED',
        USER_REACTION: 'USER_REACTION',
        COMMENT_CREATED: 'COMMENT_CREATED',
        NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
      });
    });

  });

  describe('Individual Exports', () => {
    it('should export events individually and match SubscriptionEvents values', () => {
      expect(constants.MESSAGE_CREATED).toBe(constants.SubscriptionEvents.MESSAGE_CREATED);
      expect(constants.USER_MESSAGE_CREATED).toBe(constants.SubscriptionEvents.USER_MESSAGE_CREATED);
      expect(constants.USER_REACTION).toBe(constants.SubscriptionEvents.USER_REACTION);
      expect(constants.COMMENT_CREATED).toBe(constants.SubscriptionEvents.COMMENT_CREATED);
      expect(constants.NOTIFICATION_CREATED).toBe(constants.SubscriptionEvents.NOTIFICATION_CREATED);
    });

    it('should have string values for all individual exports', () => {
      const exports = [
        constants.MESSAGE_CREATED,
        constants.USER_MESSAGE_CREATED,
        constants.USER_REACTION,
        constants.COMMENT_CREATED,
        constants.NOTIFICATION_CREATED,
      ];
      exports.forEach(val => {
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      });
    });
  });
});

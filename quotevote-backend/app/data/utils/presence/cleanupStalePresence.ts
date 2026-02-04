import Presence from '../../models/Presence';
import { pubsub } from '../pubsub';
import { logger } from '../../utils/logger';
import { SUBSCRIPTION_EVENTS } from '../../../types/graphql';

/**
 * Cleanup stale presence records
 * This is a backup to the TTL index - marks users as offline if heartbeat is old
 */
export const cleanupStalePresence = async (): Promise<void> => {
  // 2 minutes ago
  const twoMinutesAgo = new Date(Date.now() - 120000);

  try {
    // Find presence records with stale heartbeats
    const stalePresences = await Presence.find({
      lastHeartbeat: { $lt: twoMinutesAgo },
      status: { $ne: 'offline' },
    });

    for (const presence of stalePresences) {
      // Update to offline
      presence.status = 'offline';
      presence.lastSeen = new Date();
      await presence.save();

      // Publish offline event
      await pubsub.publish(SUBSCRIPTION_EVENTS.PRESENCE_UPDATED, {
        presence: {
          userId: presence.userId.toString(),
          status: 'offline',
          statusMessage: '',
          lastSeen: presence.lastSeen,
        },
      });
    }

    if (stalePresences.length > 0) {
      logger.info(`[Presence Cleanup] Marked ${stalePresences.length} users as offline`, {
        count: stalePresences.length,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[Presence Cleanup] Error: ${error.message}`, { stack: error.stack });
    } else {
      logger.error(`[Presence Cleanup] Error: ${String(error)}`);
    }
  }
};

/**
 * Start the presence cleanup job
 * Runs every 60 seconds
 */
export const startPresenceCleanup = (): void => {
  // Run cleanup every minute
  setInterval(cleanupStalePresence, 60000);
  
  // Run initial cleanup
  // void operator explicitly ignores the returned promise
  void cleanupStalePresence();
  
  logger.info('[Presence Cleanup] Started presence cleanup job');
};

export default { cleanupStalePresence, startPresenceCleanup };

import { cleanupStalePresence } from '../app/data/utils/presence/cleanupStalePresence';
import Presence from '../app/data/models/Presence';
import { pubsub } from '../app/data/utils/pubsub';
import { SUBSCRIPTION_EVENTS } from '../app/types/graphql';

// Mock dependencies
jest.mock('../app/data/models/Presence');
jest.mock('../app/data/utils/pubsub');
jest.mock('../app/data/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('cleanupStalePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find stale presences and mark them as offline', async () => {
    // Setup mock data
    const mockPresence = {
      userId: 'user123',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 300000), // 5 mins ago
      lastSeen: new Date(Date.now() - 300000),
      save: jest.fn().mockResolvedValue(true),
    };

    // keyof Type adjustment might be needed if types are strict
    (Presence.find as jest.Mock).mockResolvedValue([mockPresence]);
    
    // Execute
    await cleanupStalePresence();

    // Verify
    expect(Presence.find).toHaveBeenCalledWith({
      lastHeartbeat: { $lt: expect.any(Date) },
      status: { $ne: 'offline' },
    });

    expect(mockPresence.status).toBe('offline');
    expect(mockPresence.save).toHaveBeenCalled();
    
    expect(pubsub.publish).toHaveBeenCalledWith(
        SUBSCRIPTION_EVENTS.PRESENCE_UPDATED,
        expect.objectContaining({
            presence: expect.objectContaining({
                userId: 'user123',
                status: 'offline'
            })
        })
    );
  });

  it('should handle errors gracefully', async () => {
    const { logger } = await import('../app/data/utils/logger');
    (Presence.find as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await cleanupStalePresence();

    expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[Presence Cleanup\] Error: DB Error/),
        expect.any(Object)
    );
  });

  it('should do nothing if no stale presences are found', async () => {
    (Presence.find as jest.Mock).mockResolvedValue([]);
    await cleanupStalePresence();
    expect(pubsub.publish).not.toHaveBeenCalled();
  });

  it('should handle non-Error objects in catch block', async () => {
    const { logger } = await import('../app/data/utils/logger');
    (Presence.find as jest.Mock).mockRejectedValue('String Error');

    await cleanupStalePresence();

    expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[Presence Cleanup\] Error: String Error/)
    );
  });

  describe('startPresenceCleanup', () => {
    it('should start the cleanup job interval', async () => {
        const { startPresenceCleanup } = await import('../app/data/utils/presence/cleanupStalePresence');
        jest.useFakeTimers();
        const spy = jest.spyOn(global, 'setInterval');
        
        startPresenceCleanup();
        
        expect(spy).toHaveBeenCalledWith(expect.any(Function), 60000);
        spy.mockRestore();
        jest.useRealTimers();
    });
  });
});

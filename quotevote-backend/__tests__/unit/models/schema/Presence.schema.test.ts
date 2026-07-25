import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Presence from '~/data/models/Presence';

describe('Presence Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Presence();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Presence({ userId: createObjectId() });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Presence({ userId: createObjectId() });
      expect(doc.status).toBe('offline');
      expect(doc.lastHeartbeat).toBeInstanceOf(Date);
      expect(doc.lastSeen).toBeInstanceOf(Date);
    });

    it('should reject invalid status enum', () => {
      const doc = new Presence({
        userId: createObjectId(),
        status: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.status).toBeDefined();
    });

    it('should accept all valid status values', () => {
      for (const status of ['online', 'away', 'dnd', 'offline', 'invisible']) {
        const doc = new Presence({ userId: createObjectId(), status });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional statusMessage', () => {
      const doc = new Presence({
        userId: createObjectId(),
        statusMessage: 'Working on a feature',
      });
      expect(doc.statusMessage).toBe('Working on a feature');
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should use findOne', async () => {
      const userId = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(Presence, 'findOne').mockResolvedValue(null);

      await Presence.findByUserId(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ userId });
      findOneSpy.mockRestore();
    });

    it('updateHeartbeat upserts when no presence exists', async () => {
      const userId = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(Presence, 'findOne').mockResolvedValue(null);
      const upserted = {
        userId,
        status: 'online',
        preferredStatus: 'online',
        lastHeartbeat: new Date(),
        lastSeen: new Date(),
      };
      const findOneAndUpdateSpy = jest
        .spyOn(Presence, 'findOneAndUpdate')
        .mockResolvedValue(upserted as never);

      const result = await Presence.updateHeartbeat(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ userId });
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { userId },
        expect.objectContaining({
          $set: expect.objectContaining({
            lastHeartbeat: expect.any(Date),
            lastSeen: expect.any(Date),
          }),
          $setOnInsert: expect.objectContaining({
            status: 'online',
            preferredStatus: 'online',
          }),
        }),
        expect.objectContaining({ upsert: true, new: true, setDefaultsOnInsert: true })
      );
      expect(result).toEqual(upserted);

      findOneSpy.mockRestore();
      findOneAndUpdateSpy.mockRestore();
    });

    it('updateHeartbeat refreshes timestamps without forcing online when already present', async () => {
      const userId = createObjectId().toHexString();
      const save = jest.fn().mockImplementation(function (this: { status: string }) {
        return Promise.resolve(this);
      });
      const existing = {
        userId,
        status: 'away',
        statusMessage: 'In a meeting',
        preferredStatus: 'away',
        preferredStatusMessage: 'In a meeting',
        lastHeartbeat: new Date('2020-01-01T00:00:00.000Z'),
        lastSeen: new Date('2020-01-01T00:00:00.000Z'),
        save,
      };
      const findOneSpy = jest.spyOn(Presence, 'findOne').mockResolvedValue(existing as never);
      const findOneAndUpdateSpy = jest.spyOn(Presence, 'findOneAndUpdate');

      const result = await Presence.updateHeartbeat(userId);

      expect(findOneAndUpdateSpy).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(result.status).toBe('away');
      expect(result.statusMessage).toBe('In a meeting');
      expect(result.lastHeartbeat).toBeInstanceOf(Date);
      expect(result.lastHeartbeat).not.toEqual(new Date('2020-01-01T00:00:00.000Z'));

      findOneSpy.mockRestore();
      findOneAndUpdateSpy.mockRestore();
    });

    it('updateHeartbeat restores preferred status when currently offline', async () => {
      const userId = createObjectId().toHexString();
      const save = jest.fn().mockImplementation(function (this: unknown) {
        return Promise.resolve(this);
      });
      const existing = {
        userId,
        status: 'offline',
        statusMessage: '',
        preferredStatus: 'dnd',
        preferredStatusMessage: 'Focusing',
        lastHeartbeat: new Date('2020-01-01T00:00:00.000Z'),
        lastSeen: new Date('2020-01-01T00:00:00.000Z'),
        save,
      };
      const findOneSpy = jest.spyOn(Presence, 'findOne').mockResolvedValue(existing as never);

      const result = await Presence.updateHeartbeat(userId);

      expect(result.status).toBe('dnd');
      expect(result.statusMessage).toBe('Focusing');
      expect(save).toHaveBeenCalled();

      findOneSpy.mockRestore();
    });
  });
});

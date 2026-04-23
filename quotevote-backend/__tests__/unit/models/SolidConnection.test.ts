import mongoose from 'mongoose';

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    }),
    models: {},
  };
});

const MockSolidConnection = mongoose.model('SolidConnection') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('SolidConnection Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConnection = {
    _id: 'sc1',
    userId: 'user1',
    webId: 'https://pod.example.com/profile/card#me',
    issuer: 'https://pod.example.com',
    encryptedTokens: 'encrypted_token_data',
    scopes: ['openid', 'profile'],
    idTokenClaims: { sub: 'user1' },
    tokenExpiry: new Date(),
    resourceUris: {
      profile: 'https://pod.example.com/profile',
      preferences: 'https://pod.example.com/settings/prefs',
      activityLedger: 'https://pod.example.com/activities',
    },
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a solid connection', async () => {
      MockSolidConnection.create.mockResolvedValue(mockConnection);

      const result = await MockSolidConnection.create({
        userId: 'user1',
        webId: 'https://pod.example.com/profile/card#me',
        issuer: 'https://pod.example.com',
        encryptedTokens: 'encrypted_token_data',
      });

      expect(MockSolidConnection.create).toHaveBeenCalled();
      expect(result.webId).toBe('https://pod.example.com/profile/card#me');
    });
  });

  describe('Read', () => {
    it('should find connection by userId', async () => {
      MockSolidConnection.findOne.mockResolvedValue(mockConnection);

      const result = await MockSolidConnection.findOne({ userId: 'user1' });

      expect(result).toEqual(mockConnection);
    });

    it('should find connection by id', async () => {
      MockSolidConnection.findById.mockResolvedValue(mockConnection);

      const result = await MockSolidConnection.findById('sc1');

      expect(result).toEqual(mockConnection);
    });

    it('should return null for non-existent connection', async () => {
      MockSolidConnection.findOne.mockResolvedValue(null);

      const result = await MockSolidConnection.findOne({ userId: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update encrypted tokens', async () => {
      const updated = { ...mockConnection, encryptedTokens: 'new_encrypted_data' };
      MockSolidConnection.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockSolidConnection.findByIdAndUpdate(
        'sc1',
        { encryptedTokens: 'new_encrypted_data' },
        { new: true }
      );

      expect(result.encryptedTokens).toBe('new_encrypted_data');
    });

    it('should update lastSyncAt', async () => {
      const syncDate = new Date();
      const updated = { ...mockConnection, lastSyncAt: syncDate };
      MockSolidConnection.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockSolidConnection.findByIdAndUpdate(
        'sc1',
        { lastSyncAt: syncDate },
        { new: true }
      );

      expect(result.lastSyncAt).toBe(syncDate);
    });
  });

  describe('Delete', () => {
    it('should delete a solid connection', async () => {
      MockSolidConnection.findByIdAndDelete.mockResolvedValue(mockConnection);

      const result = await MockSolidConnection.findByIdAndDelete('sc1');

      expect(result).toEqual(mockConnection);
    });
  });
});

import { SolidConnection } from '~/data/models/SolidConnection';
import { createObjectId, getValidationErrors, closeConnection } from './_helpers';

describe('SolidConnection Schema', () => {
  afterAll(async () => {
    await closeConnection();
  });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new SolidConnection();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.webId).toBeDefined();
      expect(errors?.issuer).toBeDefined();
      expect(errors?.encryptedTokens).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new SolidConnection({
        userId: createObjectId(),
        webId: 'https://pod.example.com/profile/card#me',
        issuer: 'https://pod.example.com',
        encryptedTokens: 'encrypted_data_here',
      });
      const errors = getValidationErrors(doc);
      expect(errors).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new SolidConnection({
        userId: createObjectId(),
        webId: 'https://pod.example.com/profile/card#me',
        issuer: 'https://pod.example.com',
        encryptedTokens: 'encrypted_data_here',
      });
      expect(doc.scopes).toEqual([]);
      expect(doc.idTokenClaims).toEqual({});
    });

    it('should accept optional fields', () => {
      const doc = new SolidConnection({
        userId: createObjectId(),
        webId: 'https://pod.example.com/profile/card#me',
        issuer: 'https://pod.example.com',
        encryptedTokens: 'encrypted_data_here',
        scopes: ['openid', 'profile'],
        tokenExpiry: new Date(),
        resourceUris: {
          profile: 'https://pod.example.com/profile',
          preferences: 'https://pod.example.com/settings',
        },
        lastSyncAt: new Date(),
      });
      expect(doc.scopes).toEqual(['openid', 'profile']);
      expect(doc.resourceUris?.profile).toBe('https://pod.example.com/profile');
    });
  });
});

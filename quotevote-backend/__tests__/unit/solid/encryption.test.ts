import { encryptTokens, decryptTokens, validateEncryptionKey, generateEncryptionKey } from '../../../app/solid/storage/encryption';

describe('Solid Storage - Encryption', () => {
    const originalEnv = process.env.SOLID_TOKEN_ENCRYPTION_KEY;

    beforeAll(() => {
        // Set a test encryption key
        process.env.SOLID_TOKEN_ENCRYPTION_KEY = generateEncryptionKey();
    });

    afterAll(() => {
        // Restore original environment
        process.env.SOLID_TOKEN_ENCRYPTION_KEY = originalEnv;
    });

    describe('encryptTokens and decryptTokens', () => {
        it('should encrypt and decrypt tokens correctly', () => {
            const tokens = {
                access_token: 'test_access_token',
                refresh_token: 'test_refresh_token',
                id_token: 'test_id_token',
            };

            const encrypted = encryptTokens(tokens);
            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).toContain(':'); // Should have format iv:authTag:salt:data

            const decrypted = decryptTokens(encrypted);
            expect(decrypted).toEqual(tokens);
        });

        it('should produce different encrypted outputs for same input', () => {
            const tokens = { access_token: 'test_token' };

            const encrypted1 = encryptTokens(tokens);
            const encrypted2 = encryptTokens(tokens);

            expect(encrypted1).not.toBe(encrypted2); // Different IVs
            expect(decryptTokens(encrypted1)).toEqual(tokens);
            expect(decryptTokens(encrypted2)).toEqual(tokens);
        });

        it('should throw error when decrypting invalid data', () => {
            expect(() => decryptTokens('invalid:data:format')).toThrow();
            expect(() => decryptTokens('invalid')).toThrow('Invalid encrypted data format');
        });

        it('should throw error when decrypting tampered data', () => {
            const tokens = { access_token: 'test_token' };
            const encrypted = encryptTokens(tokens);

            // Tamper with the encrypted data
            const parts = encrypted.split(':');
            parts[3] = parts[3].slice(0, -2) + 'XX'; // Change last 2 chars
            const tampered = parts.join(':');

            expect(() => decryptTokens(tampered)).toThrow();
        });
    });

    describe('validateEncryptionKey', () => {
        it('should return true for valid key', () => {
            expect(validateEncryptionKey()).toBe(true);
        });

        it('should return false when key is not set', () => {
            const originalKey = process.env.SOLID_TOKEN_ENCRYPTION_KEY;
            delete process.env.SOLID_TOKEN_ENCRYPTION_KEY;

            expect(validateEncryptionKey()).toBe(false);

            process.env.SOLID_TOKEN_ENCRYPTION_KEY = originalKey;
        });

        it('should return false for invalid key length', () => {
            const originalKey = process.env.SOLID_TOKEN_ENCRYPTION_KEY;
            process.env.SOLID_TOKEN_ENCRYPTION_KEY = 'short_key';

            expect(validateEncryptionKey()).toBe(false);

            process.env.SOLID_TOKEN_ENCRYPTION_KEY = originalKey;
        });
    });

    describe('generateEncryptionKey', () => {
        it('should generate a valid 64-character hex key', () => {
            const key = generateEncryptionKey();

            expect(key).toBeTruthy();
            expect(typeof key).toBe('string');
            expect(key.length).toBe(64);
            expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
        });

        it('should generate different keys each time', () => {
            const key1 = generateEncryptionKey();
            const key2 = generateEncryptionKey();

            expect(key1).not.toBe(key2);
        });
    });
});

import crypto from 'crypto';

/**
 * Encryption utilities for Solid Pod tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * @throws {Error} if SOLID_TOKEN_ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
    const key = process.env.SOLID_TOKEN_ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            'SOLID_TOKEN_ENCRYPTION_KEY environment variable is not set. ' +
            'Generate a secure key using: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
        );
    }

    // Ensure key is 32 bytes (256 bits) for AES-256
    if (key.length !== 64) {
        throw new Error(
            'SOLID_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). ' +
            'Generate using: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
        );
    }

    return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive token data
 * @param data - Object containing tokens to encrypt
 * @returns Encrypted string in format: iv:authTag:salt:encryptedData
 */
export function encryptTokens(data: Record<string, unknown>): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:salt:encryptedData
    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        salt.toString('hex'),
        encrypted,
    ].join(':');
}

/**
 * Decrypt token data
 * @param encryptedData - Encrypted string from encryptTokens
 * @returns Decrypted object containing tokens
 * @throws {Error} if decryption fails or data is tampered
 */
export function decryptTokens(encryptedData: string): Record<string, unknown> {
    const key = getEncryptionKey();

    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, , encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
}

/**
 * Validate encryption key format
 * @returns true if key is valid, false otherwise
 */
export function validateEncryptionKey(): boolean {
    try {
        getEncryptionKey();
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate a new encryption key (for documentation/setup purposes)
 * @returns Hex-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Human Tasks:
 * 1. Ensure Node.js version >= 16.x is installed for crypto module support
 * 2. Review key lengths and iteration counts with security team
 * 3. Verify memory allocation limits for crypto operations in production
 * 4. Document key rotation procedures for production deployment
 */

// node:crypto - Built-in Node.js crypto module
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { SECURITY } from '../config/constants';
import type { SecurityConfig } from '../types/config';

// Constants for encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 32 bytes for AES-256
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

/**
 * @requirement: Data Security - Implementation of AES-256-GCM encryption
 * Encrypts sensitive data using AES-256-GCM with authentication
 */
export function encrypt(data: string, key: string): { ciphertext: string; iv: string; tag: string } {
    // Generate random initialization vector
    const iv = randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'base64'), iv);

    // Encrypt the data
    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
        ciphertext: encryptedData,
        iv: iv.toString('base64'),
        tag: authTag.toString('base64')
    };
}

/**
 * @requirement: Data Security - Implementation of AES-256-GCM decryption
 * Decrypts data that was encrypted using AES-256-GCM
 */
export function decrypt(
    encryptedData: { ciphertext: string; iv: string; tag: string },
    key: string
): string {
    // Create decipher
    const decipher = createDecipheriv(
        ENCRYPTION_ALGORITHM,
        Buffer.from(key, 'base64'),
        Buffer.from(encryptedData.iv, 'base64')
    );

    // Set auth tag for GCM
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

    // Decrypt the data
    let decryptedData = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
}

/**
 * @requirement: Data Security - Implementation of PBKDF2 password hashing
 * Creates a secure hash of a password using PBKDF2
 */
export function hashPassword(password: string): { hash: string; salt: string } {
    // Generate random salt
    const salt = randomBytes(SALT_LENGTH);

    // Generate hash using PBKDF2
    const hash = pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        PBKDF2_DIGEST
    );

    return {
        hash: hash.toString('base64'),
        salt: salt.toString('base64')
    };
}

/**
 * @requirement: Security Architecture - Implementation of secure password verification
 * Verifies a password against its stored hash using timing-safe comparison
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
    // Generate hash of provided password
    const hashToVerify = pbkdf2Sync(
        password,
        Buffer.from(salt, 'base64'),
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        PBKDF2_DIGEST
    );

    // Perform timing-safe comparison
    try {
        return timingSafeEqual(
            hashToVerify,
            Buffer.from(hash, 'base64')
        );
    } catch (error) {
        return false;
    }
}

/**
 * @requirement: Security Architecture - Implementation of secure key generation
 * Generates a cryptographically secure random key
 */
export function generateKey(length: number): string {
    if (length <= 0) {
        throw new Error('Key length must be positive');
    }
    
    // Generate random bytes for key
    const keyBytes = randomBytes(length);
    return keyBytes.toString('base64');
}
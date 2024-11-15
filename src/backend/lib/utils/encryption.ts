/**
 * Core encryption utility that provides secure data encryption and decryption functions
 * using industry-standard algorithms.
 * 
 * Requirements addressed:
 * - Data Security (8.2.2): Implements AES-256 encryption for confidential data and secure key management
 * - Security Controls (7.3.6): Provides encryption utilities for secure data handling and transmission
 * 
 * Human Tasks:
 * 1. Set up ENCRYPTION_KEY environment variable with a secure 32-byte (256-bit) key
 * 2. Review and adjust PBKDF2 iterations based on deployment environment performance requirements
 */

import { error as logError, debug as logDebug } from './logger';
import { BaseError } from './errors';
import crypto from 'node:crypto'; // Built-in Node.js crypto module

// Constants for encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

// Interface for encrypted data structure
interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

/**
 * Generates a cryptographically secure encryption key
 * Requirement: Data Security - Secure key management
 */
export function generateKey(length: number): Buffer {
  try {
    logDebug('Generating new encryption key');
    return crypto.randomBytes(length);
  } catch (err) {
    logError('Failed to generate encryption key', { error: err });
    throw new BaseError('Encryption key generation failed', 'ENCRYPTION_ERROR', { length });
  }
}

/**
 * Encrypts data using AES-256-GCM
 * Requirement: Data Security - AES-256 encryption for confidential data
 */
export function encrypt(data: string): EncryptedData {
  if (!data) {
    throw new BaseError('Data to encrypt is required', 'VALIDATION_ERROR');
  }

  if (!ENCRYPTION_KEY) {
    throw new BaseError('Encryption key is not configured', 'CONFIGURATION_ERROR');
  }

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Encrypt the data
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    logDebug('Data encrypted successfully');

    return {
      iv: iv.toString('hex'),
      encryptedData: encryptedData,
      authTag: authTag.toString('hex')
    };
  } catch (err) {
    logError('Encryption failed', { error: err });
    throw new BaseError('Data encryption failed', 'ENCRYPTION_ERROR');
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * Requirement: Data Security - Secure data decryption
 */
export function decrypt(encryptedData: EncryptedData): string {
  if (!encryptedData?.iv || !encryptedData.encryptedData || !encryptedData.authTag) {
    throw new BaseError('Invalid encrypted data structure', 'VALIDATION_ERROR');
  }

  if (!ENCRYPTION_KEY) {
    throw new BaseError('Encryption key is not configured', 'CONFIGURATION_ERROR');
  }

  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    // Set auth tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    logDebug('Data decrypted successfully');

    return decrypted;
  } catch (err) {
    logError('Decryption failed', { error: err });
    throw new BaseError('Data decryption failed', 'ENCRYPTION_ERROR');
  }
}

/**
 * Hashes password using PBKDF2 with salt
 * Requirement: Security Controls - Secure password handling
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  if (!password) {
    throw new BaseError('Password is required', 'VALIDATION_ERROR');
  }

  try {
    // Generate random salt
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Hash password using PBKDF2
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    );

    logDebug('Password hashed successfully');

    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    };
  } catch (err) {
    logError('Password hashing failed', { error: err });
    throw new BaseError('Password hashing failed', 'ENCRYPTION_ERROR');
  }
}

/**
 * Verifies password against stored hash
 * Requirement: Security Controls - Secure password verification
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  if (!password || !hash || !salt) {
    throw new BaseError('Password, hash and salt are required', 'VALIDATION_ERROR');
  }

  try {
    // Hash the input password with the stored salt
    const hashVerify = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'hex'),
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    );

    // Compare hashes using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      hashVerify
    );

    logDebug('Password verification completed');

    return isValid;
  } catch (err) {
    logError('Password verification failed', { error: err });
    throw new BaseError('Password verification failed', 'ENCRYPTION_ERROR');
  }
}
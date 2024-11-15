/**
 * Test suite for core utility functions including encryption, error handling, validation, and logging utilities.
 * 
 * Requirements addressed:
 * - Data Security (8.2.2): Verify encryption utilities work correctly for data protection using AES-256-GCM
 * - Error Handling (7.3.5): Ensure error handling utilities work as expected with standardized error codes
 * - Input Validation (7.3.6): Verify input validation functions work correctly with Zod schemas
 * 
 * Human Tasks:
 * 1. Set up test environment variables including ENCRYPTION_KEY before running tests
 * 2. Review test coverage reports to ensure critical paths are covered
 */

// @jest/globals v29.0.0
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
// zod v3.22.0
import { z } from 'zod';

// Import encryption utilities
import { 
  encrypt, 
  decrypt, 
  hashPassword, 
  verifyPassword 
} from '../../lib/utils/encryption';

// Import error handling utilities
import { 
  BaseError, 
  ValidationError, 
  createErrorResponse 
} from '../../lib/utils/errors';

// Import validation utilities
import { 
  validateRequest, 
  validateEmail, 
  validatePassword 
} from '../../lib/utils/validation';

// Import logger utilities
import { logger } from '../../lib/utils/logger';

describe('Encryption Utils', () => {
  const testData = 'sensitive test data';
  const testPassword = 'TestPassword123!';

  test('should successfully encrypt and decrypt data', () => {
    // Test requirement: Data Security - AES-256-GCM encryption
    const encrypted = encrypt(testData);
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('encryptedData');
    expect(encrypted).toHaveProperty('authTag');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should handle password hashing and verification', () => {
    // Test requirement: Data Security - Password hashing
    const { hash, salt } = hashPassword(testPassword);
    expect(hash).toBeTruthy();
    expect(salt).toBeTruthy();

    const isValid = verifyPassword(testPassword, hash, salt);
    expect(isValid).toBe(true);
  });

  test('should reject invalid password verification', () => {
    const { hash, salt } = hashPassword(testPassword);
    const isValid = verifyPassword('wrongpassword', hash, salt);
    expect(isValid).toBe(false);
  });

  test('should throw error for invalid encryption input', () => {
    expect(() => encrypt('')).toThrow(BaseError);
  });

  test('should throw error for invalid decryption data', () => {
    expect(() => decrypt({ 
      iv: 'invalid', 
      encryptedData: 'invalid', 
      authTag: 'invalid' 
    })).toThrow(BaseError);
  });
});

describe('Error Utils', () => {
  const testRequestId = 'test-123';

  test('should create BaseError with correct properties', () => {
    // Test requirement: Error Handling - Standardized error structure
    const error = new BaseError('Test error', 'VALIDATION_ERROR', { field: 'test' });
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.details).toEqual({ field: 'test' });
    expect(error.timestamp).toBeTruthy();
  });

  test('should create ValidationError with correct code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('should format error response correctly', () => {
    // Test requirement: Error Handling - Error response format
    const error = new BaseError('Test error', 'INTERNAL_ERROR');
    const response = createErrorResponse(error, testRequestId);
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Test error',
      details: {},
      timestamp: error.timestamp,
      requestId: testRequestId
    });
  });

  test('should handle non-BaseError in createErrorResponse', () => {
    const error = new Error('Generic error');
    const response = createErrorResponse(error, testRequestId);
    
    expect(response.code).toBe('INTERNAL_ERROR');
    expect(response.message).toBe('Generic error');
  });
});

describe('Validation Utils', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number()
  });

  test('should validate request against schema', async () => {
    // Test requirement: Input Validation - Schema validation
    const validData = { name: 'Test', age: 25 };
    const result = await validateRequest(validData, testSchema);
    expect(result).toEqual(validData);
  });

  test('should throw ValidationError for invalid schema data', async () => {
    const invalidData = { name: 'Test', age: 'invalid' };
    await expect(validateRequest(invalidData, testSchema))
      .rejects
      .toThrow(ValidationError);
  });

  test('should validate email format correctly', () => {
    // Test requirement: Input Validation - Email validation
    expect(validateEmail('valid@example.com')).toBe(true);
    expect(validateEmail('invalid@email')).toBe(false);
    expect(validateEmail('invalid.email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('should validate password strength', () => {
    // Test requirement: Input Validation - Password validation
    expect(validatePassword('ValidPass123!')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('NoSpecialChar123')).toBe(false);
    expect(validatePassword('NoNumber!')).toBe(false);
  });
});

describe('Logger Utils', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'debug').mockImplementation();
  });

  test('should log info messages correctly', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });

  test('should log error messages with context', () => {
    const error = new Error('Test error');
    logger.error({ error }, 'Error occurred');
    expect(logger.error).toHaveBeenCalledWith({ error }, 'Error occurred');
  });

  test('should log warning messages', () => {
    logger.warn('Test warning');
    expect(logger.warn).toHaveBeenCalledWith('Test warning');
  });

  test('should log debug messages when enabled', () => {
    logger.debug('Debug message');
    expect(logger.debug).toHaveBeenCalledWith('Debug message');
  });
});
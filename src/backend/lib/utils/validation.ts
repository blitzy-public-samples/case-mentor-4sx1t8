/**
 * Core validation utility that provides functions and helpers for validating API requests,
 * data models, and user inputs across the backend application.
 * 
 * Requirements addressed:
 * - Input Validation (7.3.6): Implements JSON Schema validation using Zod
 * - Data Validation (5.4): Comprehensive validation of requests, query params, emails and passwords
 */

// zod v3.22.0
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * RFC 5322 compliant email validation regex
 * Requirement: Data Validation - Email format validation
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Minimum password length requirement
 */
const PASSWORD_MIN_LENGTH = 8;

/**
 * Password strength validation regex
 * Requires:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates an incoming API request body against a Zod schema
 * Requirement: Input Validation - JSON Schema validation
 */
export async function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Request validation failed', {
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    }
    throw error;
  }
}

/**
 * Validates URL query parameters with type coercion
 * Requirement: Data Validation - Query parameter validation
 */
export async function validateQueryParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    // Create a schema that coerces string values to their proper types
    const coercedSchema = z.preprocess(val => {
      if (typeof val === 'string') {
        // Attempt to coerce numbers
        if (!isNaN(Number(val))) {
          return Number(val);
        }
        // Coerce booleans
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return val;
    }, schema);

    return await coercedSchema.parseAsync(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Query parameter validation failed', {
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    }
    throw error;
  }
}

/**
 * Validates email format according to RFC 5322 standard
 * Requirement: Data Validation - Email validation
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Check maximum length (254 characters as per RFC 5321)
  if (email.length > 254) {
    return false;
  }

  // Test against RFC 5322 regex
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Additional domain validation
  const [, domain] = email.split('@');
  if (!domain) {
    return false;
  }

  // Verify domain has at least one period and valid TLD length
  const parts = domain.split('.');
  if (parts.length < 2) {
    return false;
  }

  // Verify TLD is between 2 and 63 characters
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || tld.length > 63) {
    return false;
  }

  return true;
}

/**
 * Validates password strength requirements
 * Requirement: Data Validation - Password strength validation
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Check minimum length
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  // Test against password strength regex
  return PASSWORD_REGEX.test(password);
}
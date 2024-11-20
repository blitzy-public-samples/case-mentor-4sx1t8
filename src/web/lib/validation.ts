// zod version: ^3.0.0

import { z } from 'zod';
import { LoginCredentials, RegisterCredentials } from '../types/auth';
import { DrillAttempt } from '../types/drills';

/**
 * Human Tasks:
 * 1. Configure rate limiting for validation endpoints to prevent abuse
 * 2. Set up monitoring for validation failures to detect potential attacks
 * 3. Review and update password complexity requirements periodically
 * 4. Ensure error messages are properly localized before deployment
 */

// Constants for validation rules
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_RESPONSE_LENGTH = 5000;

/**
 * @requirement Input Validation
 * Interface for validation results with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

/**
 * @requirement Input Validation
 * Interface for validation schemas with rules and messages
 */
interface ValidationSchema {
  type: string;
  rules: Record<string, any>;
  messages: Record<string, string>;
}

/**
 * @requirement Input Validation
 * Validates email format and domain according to RFC 5322 standard
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  if (email.length > 254) { // RFC 5321 maximum length
    return false;
  }

  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) { // RFC 5321 local-part maximum length
    return false;
  }

  return domain.split('.').every(part => part.length <= 63); // RFC 1035 domain label maximum length
};

/**
 * @requirement Input Validation
 * Validates password strength and security requirements
 */
export const validatePassword = (password: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    fieldErrors: {}
  };

  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    result.isValid = false;
    result.errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }

  // Calculate password complexity score
  let complexityScore = 0;
  complexityScore += /[A-Z]/.test(password) ? 1 : 0;
  complexityScore += /[a-z]/.test(password) ? 1 : 0;
  complexityScore += /[0-9]/.test(password) ? 1 : 0;
  complexityScore += /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 1 : 0;
  complexityScore += password.length >= 12 ? 1 : 0;

  if (complexityScore < 3) {
    result.isValid = false;
    result.errors.push('Password is not complex enough');
  }

  if (!result.isValid) {
    result.fieldErrors.password = result.errors[0];
  }

  return result;
};

/**
 * @requirement Form Validation
 * Validates drill response based on drill type and evaluation criteria
 */
export const validateDrillResponse = (attempt: DrillAttempt): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    fieldErrors: {}
  };

  if (!attempt.response || typeof attempt.response !== 'object') {
    result.isValid = false;
    result.errors.push('Invalid drill response format');
    return result;
  }

  // Validate response content length
  const responseStr = JSON.stringify(attempt.response);
  if (responseStr.length > MAX_RESPONSE_LENGTH) {
    result.isValid = false;
    result.errors.push(`Response exceeds maximum length of ${MAX_RESPONSE_LENGTH} characters`);
  }

  // Validate required fields based on drill type
  const requiredFields = ['content', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in attempt.response)) {
      result.isValid = false;
      result.errors.push(`Missing required field: ${field}`);
      result.fieldErrors[field] = 'This field is required';
    }
  }

  // Validate performance metrics
  if (!attempt.performanceMetrics) {
    result.isValid = false;
    result.errors.push('Performance metrics are required');
  } else {
    const metricsSchema = z.object({
      timeSpent: z.number().min(0),
      attemptsCount: z.number().min(1),
      averageScore: z.number().min(0).max(100),
      completionRate: z.number().min(0).max(100),
      strengthAreas: z.array(z.string()),
      improvementAreas: z.array(z.string())
    });

    const metricsValidation = metricsSchema.safeParse(attempt.performanceMetrics);
    if (!metricsValidation.success) {
      result.isValid = false;
      result.errors.push('Invalid performance metrics format');
      result.fieldErrors.performanceMetrics = 'Invalid metrics data';
    }
  }

  return result;
};

/**
 * @requirement Form Validation
 * Validates complete login form data with all required fields
 */
export const validateLoginForm = (credentials: LoginCredentials): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    fieldErrors: {}
  };

  if (!validateEmail(credentials.email)) {
    result.isValid = false;
    result.errors.push('Invalid email address');
    result.fieldErrors.email = 'Invalid email address';
  }

  const passwordValidation = validatePassword(credentials.password);
  if (!passwordValidation.isValid) {
    result.isValid = false;
    result.errors.push(...passwordValidation.errors);
    result.fieldErrors.password = passwordValidation.fieldErrors.password;
  }

  if (credentials.captchaToken !== undefined && (!credentials.captchaToken || credentials.captchaToken.length < 10)) {
    result.isValid = false;
    result.errors.push('Invalid CAPTCHA token');
    result.fieldErrors.captchaToken = 'Invalid CAPTCHA token';
  }

  return result;
};

/**
 * @requirement Form Validation
 * Validates complete registration form data with all required fields
 */
export const validateRegistrationForm = (credentials: RegisterCredentials): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    fieldErrors: {}
  };

  if (!validateEmail(credentials.email)) {
    result.isValid = false;
    result.errors.push('Invalid email address');
    result.fieldErrors.email = 'Invalid email address';
  }

  const passwordValidation = validatePassword(credentials.password);
  if (!passwordValidation.isValid) {
    result.isValid = false;
    result.errors.push(...passwordValidation.errors);
    result.fieldErrors.password = passwordValidation.fieldErrors.password;
  }

  if (credentials.password !== credentials.confirmPassword) {
    result.isValid = false;
    result.errors.push('Passwords do not match');
    result.fieldErrors.confirmPassword = 'Passwords do not match';
  }

  if (!credentials.fullName || credentials.fullName.trim().length < 2) {
    result.isValid = false;
    result.errors.push('Full name is required');
    result.fieldErrors.fullName = 'Full name is required';
  }

  if (!credentials.captchaToken || credentials.captchaToken.length < 10) {
    result.isValid = false;
    result.errors.push('CAPTCHA verification is required');
    result.fieldErrors.captchaToken = 'CAPTCHA verification is required';
  }

  if (!credentials.acceptedTerms) {
    result.isValid = false;
    result.errors.push('You must accept the terms and conditions');
    result.fieldErrors.acceptedTerms = 'You must accept the terms and conditions';
  }

  return result;
};
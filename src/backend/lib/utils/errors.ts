/**
 * Core error handling utility that defines custom error classes and helper functions
 * for standardized error handling across the backend application.
 * 
 * Requirements addressed:
 * - Error Handling (7.3.5): Implements standardized error handling with consistent error codes and messages
 * - System Performance (2.0): Supports API response time targets through efficient error handling
 */

import { APIError, ErrorCode } from '../types/api';

/**
 * Base custom error class that extends Error with additional properties for API error handling
 * Requirement: Error Handling - Consistent error structure
 */
export class BaseError extends Error implements APIError {
  public readonly code: ErrorCode;
  public readonly details: Record<string, any>;
  public readonly timestamp: string;
  public readonly requestId: string = '';
  public readonly traceId?: string;

  constructor(message: string, code: ErrorCode, details: Record<string, any> = {}) {
    super(message);
    
    // Set error name to class name for better error identification
    this.name = this.constructor.name;
    
    // Initialize required APIError interface properties
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class for request validation failures
 * Requirement: Error Handling - Specific error types for validation
 */
export class ValidationError extends BaseError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * Error class for authentication failures
 * Requirement: Error Handling - Specific error types for authentication
 */
export class AuthenticationError extends BaseError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, details);
  }
}

/**
 * Error class for rate limit exceeded scenarios
 * Requirement: Error Handling - Specific error types for rate limiting
 */
export class RateLimitError extends BaseError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.RATE_LIMIT_ERROR, details);
  }
}

/**
 * Type guard function to check if an error is a BaseError instance
 * Requirement: Error Handling - Error type validation
 */
export function isBaseError(error: unknown): error is BaseError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const potentialBaseError = error as BaseError;
  
  return (
    potentialBaseError instanceof BaseError &&
    typeof potentialBaseError.code === 'string' &&
    typeof potentialBaseError.message === 'string' &&
    typeof potentialBaseError.timestamp === 'string' &&
    Object.values(ErrorCode).includes(potentialBaseError.code as ErrorCode)
  );
}

/**
 * Creates a standardized error response object for API endpoints
 * Requirement: Error Handling - Consistent error response format
 * Requirement: System Performance - Optimized error response generation
 */
export function createErrorResponse(error: Error, requestId: string): APIError {
  if (isBaseError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      requestId,
      traceId: error.traceId
    };
  }

  // Handle non-BaseError instances with a generic internal error response
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: error.message || 'An unexpected error occurred',
    details: {},
    timestamp: new Date().toISOString(),
    requestId
  };
}
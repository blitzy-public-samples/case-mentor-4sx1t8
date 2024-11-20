// date-fns v2.30.0
import { format } from 'date-fns';
import { APIResponse, APIError, ErrorCode } from '../types/api';
import { DrillType, DrillDifficulty } from '../types/drills';

/**
 * Human Tasks:
 * 1. Configure date format strings in environment variables if customization is needed
 * 2. Set up error message translations for different locales if internationalization is required
 * 3. Configure performance monitoring for API response time tracking
 */

// Requirement: User Interface Design - Consistent date formatting across the platform
export function formatDate(date: Date | string | number, formatString: string): string {
  if (!date) {
    throw new Error('Date parameter is required');
  }
  
  const dateObject = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObject.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  return format(dateObject, formatString);
}

// Requirement: System Performance - Standardized duration formatting for performance metrics
export function formatDuration(milliseconds: number): string {
  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    throw new Error('Duration must be a positive number');
  }
  
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  return `${minutes}m ${seconds}s`;
}

// Requirement: User Interface Design - Consistent score presentation
export function formatScore(score: number, decimalPlaces: number = 1): string {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new Error('Score must be a number between 0 and 1');
  }
  
  if (typeof decimalPlaces !== 'number' || decimalPlaces < 0) {
    throw new Error('Decimal places must be a non-negative number');
  }
  
  const percentage = (score * 100).toFixed(decimalPlaces);
  return `${percentage}%`;
}

// Requirement: User Interface Design - Drill type validation
export function isValidDrillType(value: unknown): value is DrillType {
  if (typeof value !== 'string') {
    return false;
  }
  
  return Object.values(DrillType).includes(value as DrillType);
}

// Requirement: User Interface Design - Drill difficulty validation
export function isValidDifficulty(value: unknown): value is DrillDifficulty {
  if (typeof value !== 'string') {
    return false;
  }
  
  return Object.values(DrillDifficulty).includes(value as DrillDifficulty);
}

// Requirement: User Interface Design - Consistent error message presentation
export function handleAPIError(error: APIError): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  const defaultMessages: Record<ErrorCode, string> = {
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
    [ErrorCode.AUTHENTICATION_ERROR]: 'Please sign in to continue',
    [ErrorCode.RATE_LIMIT_ERROR]: 'Too many requests. Please try again later',
    [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please try again'
  };

  const errorMessage = error.message || defaultMessages[error.code] || 'An unexpected error occurred';
  
  if (error.details && Object.keys(error.details).length > 0) {
    const details = Object.entries(error.details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    return `${errorMessage} (${details})`;
  }
  
  return errorMessage;
}
// @jest/globals v29.7.0
import { describe, it, expect } from '@jest/globals';
// date-fns v2.30.0
import { format } from 'date-fns';

import {
  formatDate,
  formatDuration,
  formatScore,
  isValidDrillType,
  isValidDifficulty,
  handleAPIError
} from '../../lib/utils';

import { DrillType, DrillDifficulty } from '../../types/drills';
import { APIError, ErrorCode } from '../../types/api';

/**
 * Human Tasks:
 * 1. Ensure test environment has proper timezone configuration for date tests
 * 2. Configure test coverage thresholds in Jest configuration
 * 3. Set up continuous integration pipeline to run tests automatically
 */

// Requirement: User Interface Design - Tests for consistent date formatting
describe('formatDate', () => {
  it('should format Date object correctly with default format', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');
    expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2023-12-25');
  });

  it('should format timestamp correctly', () => {
    const timestamp = 1703498400000; // 2023-12-25T10:00:00Z
    expect(formatDate(timestamp, 'MM/dd/yyyy')).toBe('12/25/2023');
  });

  it('should format ISO date string correctly', () => {
    const isoString = '2023-12-25T10:30:00Z';
    expect(formatDate(isoString, 'dd MMM yyyy')).toBe('25 Dec 2023');
  });

  it('should handle invalid dates by throwing error', () => {
    expect(() => formatDate('invalid-date', 'yyyy-MM-dd')).toThrow('Invalid date provided');
  });

  it('should support different date-fns format strings', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');
    expect(formatDate(testDate, 'HH:mm:ss')).toBe('10:30:00');
    expect(formatDate(testDate, 'MMMM do yyyy')).toBe('December 25th 2023');
  });
});

// Requirement: System Performance - Tests for duration formatting
describe('formatDuration', () => {
  it("should format zero duration as '0s'", () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('should format seconds only (< 60s)', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(150000)).toBe('2m 30s');
  });

  it('should format hours, minutes and seconds', () => {
    expect(formatDuration(4530000)).toBe('75m 30s');
  });

  it('should throw error for negative durations', () => {
    expect(() => formatDuration(-1000)).toThrow('Duration must be a positive number');
  });
});

// Requirement: User Interface Design - Tests for score formatting
describe('formatScore', () => {
  it("should format perfect score (1.0) as '100%'", () => {
    expect(formatScore(1.0)).toBe('100.0%');
  });

  it("should format zero score (0.0) as '0%'", () => {
    expect(formatScore(0.0)).toBe('0.0%');
  });

  it('should format decimal scores with specified precision', () => {
    expect(formatScore(0.756, 2)).toBe('75.60%');
    expect(formatScore(0.756, 1)).toBe('75.6%');
    expect(formatScore(0.756, 0)).toBe('76%');
  });

  it('should handle invalid scores by throwing error', () => {
    expect(() => formatScore(-0.1)).toThrow('Score must be a number between 0 and 1');
    expect(() => formatScore(1.1)).toThrow('Score must be a number between 0 and 1');
  });

  it('should handle invalid decimal places by throwing error', () => {
    expect(() => formatScore(0.5, -1)).toThrow('Decimal places must be a non-negative number');
  });
});

// Requirement: User Interface Design - Tests for drill type validation
describe('isValidDrillType', () => {
  it('should validate all DrillType enum values', () => {
    expect(isValidDrillType(DrillType.CASE_PROMPT)).toBe(true);
    expect(isValidDrillType(DrillType.CALCULATION)).toBe(true);
    expect(isValidDrillType(DrillType.CASE_MATH)).toBe(true);
    expect(isValidDrillType(DrillType.BRAINSTORMING)).toBe(true);
    expect(isValidDrillType(DrillType.MARKET_SIZING)).toBe(true);
    expect(isValidDrillType(DrillType.SYNTHESIZING)).toBe(true);
  });

  it('should reject invalid drill type strings', () => {
    expect(isValidDrillType('INVALID_TYPE')).toBe(false);
    expect(isValidDrillType('')).toBe(false);
  });

  it('should handle null and undefined as invalid', () => {
    expect(isValidDrillType(null)).toBe(false);
    expect(isValidDrillType(undefined)).toBe(false);
  });

  it('should be case sensitive in validation', () => {
    expect(isValidDrillType('case_prompt')).toBe(false);
    expect(isValidDrillType('Case_Prompt')).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(isValidDrillType(123)).toBe(false);
    expect(isValidDrillType({})).toBe(false);
    expect(isValidDrillType([])).toBe(false);
  });
});

// Requirement: User Interface Design - Tests for difficulty validation
describe('isValidDifficulty', () => {
  it('should validate all DrillDifficulty enum values', () => {
    expect(isValidDifficulty(DrillDifficulty.BEGINNER)).toBe(true);
    expect(isValidDifficulty(DrillDifficulty.INTERMEDIATE)).toBe(true);
    expect(isValidDifficulty(DrillDifficulty.ADVANCED)).toBe(true);
  });

  it('should reject invalid difficulty strings', () => {
    expect(isValidDifficulty('EXPERT')).toBe(false);
    expect(isValidDifficulty('')).toBe(false);
  });

  it('should handle null and undefined as invalid', () => {
    expect(isValidDifficulty(null)).toBe(false);
    expect(isValidDifficulty(undefined)).toBe(false);
  });

  it('should be case sensitive in validation', () => {
    expect(isValidDifficulty('beginner')).toBe(false);
    expect(isValidDifficulty('Beginner')).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(isValidDifficulty(123)).toBe(false);
    expect(isValidDifficulty({})).toBe(false);
    expect(isValidDifficulty([])).toBe(false);
  });
});

// Requirement: User Interface Design - Tests for API error handling
describe('handleAPIError', () => {
  it('should handle validation errors with detailed messages', () => {
    const error: APIError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: { field: 'email', error: 'Invalid format' }
    };
    expect(handleAPIError(error)).toBe('Validation failed (field: email, error: Invalid format)');
  });

  it('should handle authentication errors with proper message', () => {
    const error: APIError = {
      code: ErrorCode.AUTHENTICATION_ERROR,
      message: 'Authentication required',
      details: {}
    };
    expect(handleAPIError(error)).toBe('Authentication required');
  });

  it('should handle rate limit errors with retry info', () => {
    const error: APIError = {
      code: ErrorCode.RATE_LIMIT_ERROR,
      message: 'Rate limit exceeded',
      details: { retryAfter: '60 seconds' }
    };
    expect(handleAPIError(error)).toBe('Rate limit exceeded (retryAfter: 60 seconds)');
  });

  it('should handle internal errors with generic message', () => {
    const error: APIError = {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      details: {}
    };
    expect(handleAPIError(error)).toBe('Internal server error');
  });

  it('should handle unknown error codes gracefully', () => {
    const error: APIError = {
      code: 'UNKNOWN_ERROR' as ErrorCode,
      message: '',
      details: {}
    };
    expect(handleAPIError(error)).toBe('An unexpected error occurred');
  });
});
// Import drill and simulation types from relative paths
import { DrillAttempt } from './drills';
import { SimulationResult } from './simulation';

/**
 * Human Tasks:
 * 1. Configure rate limiting rules in the API gateway/middleware
 * 2. Set up monitoring for API response times to ensure 200ms SLA
 * 3. Implement proper error logging and tracking in production
 * 4. Configure proper request ID generation and tracing
 */

// Requirement: System Performance - API response time monitoring and error handling
export interface APIResponse<T> {
  success: boolean;
  data: T;
  error: APIError | null;
  timestamp: string; // ISO 8601 format
  requestId: string; // UUID v4 for request tracing
}

// Requirement: System Performance - Standardized error handling structure
export interface APIError {
  code: ErrorCode;
  message: string;
  details: Record<string, any>;
}

// Requirement: System Performance - Error classification system
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Requirement: Rate Limiting - Tier-based rate limiting for API requests
export interface RateLimitInfo {
  limit: number; // Maximum requests allowed
  remaining: number; // Remaining requests in window
  reset: number; // Unix timestamp when limit resets
}

// Requirement: System Performance - Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Requirement: System Performance - Type alias for drill-related API responses
export type DrillResponse = APIResponse<DrillAttempt>;

// Requirement: System Performance - Type alias for simulation-related API responses
export type SimulationResponse = APIResponse<SimulationResult>;
/**
 * Rate limiting configuration module implementing token bucket algorithm
 * for tier-based request throttling
 * 
 * Human Tasks:
 * 1. Verify rate limit configurations align with infrastructure capacity
 * 2. Set up monitoring for rate limit hits and near-limit warnings
 * 3. Configure Redis or similar for distributed rate limit tracking
 * 4. Implement rate limit metrics collection for analytics
 */

import { RateLimitInfo } from '../types/api';
import { AuthErrorCode } from '../types/auth';

/**
 * Interface defining rate limit configuration per subscription tier
 * Requirement: Rate Limiting Strategy - Define tier-based rate limits
 */
export interface RateLimitConfig {
  requestsPerHour: number;  // Maximum requests allowed per hour
  burstSize: number;        // Maximum concurrent requests allowed
  windowMs: number;         // Time window in milliseconds
}

/**
 * Interface mapping subscription tiers to their rate limit configurations
 * Requirement: Rate Limiting Strategy - Tier-specific quotas
 */
export interface RateLimitTierMap {
  free: RateLimitConfig;
  basic: RateLimitConfig;
  premium: RateLimitConfig;
}

/**
 * Rate limit configurations for each subscription tier
 * Requirement: Security Controls - Token bucket algorithm implementation
 * Requirement: System Performance - Maintain <200ms API response time
 */
export const rateLimitConfig: RateLimitTierMap = {
  free: {
    requestsPerHour: 60,    // 1 request per minute average
    burstSize: 5,          // Allow small burst for better UX
    windowMs: 3600000      // 1 hour window (3600000ms)
  },
  basic: {
    requestsPerHour: 300,   // 5 requests per minute average
    burstSize: 10,         // Moderate burst capacity
    windowMs: 3600000      // 1 hour window (3600000ms)
  },
  premium: {
    requestsPerHour: 1000,  // ~16.67 requests per minute average
    burstSize: 20,         // Large burst capacity
    windowMs: 3600000      // 1 hour window (3600000ms)
  }
};

/**
 * Retrieves the rate limit configuration for a given subscription tier
 * Requirement: Rate Limiting Strategy - Dynamic tier configuration lookup
 * 
 * @param tier - Subscription tier of the user
 * @returns RateLimitConfig for the specified tier
 */
export function getRateLimitConfig(tier: string): RateLimitConfig {
  // Convert tier to lowercase for case-insensitive comparison
  const normalizedTier = tier.toLowerCase();
  
  // Validate tier and return corresponding configuration
  if (normalizedTier in rateLimitConfig) {
    return rateLimitConfig[normalizedTier as keyof RateLimitTierMap];
  }
  
  // Fall back to free tier configuration if tier is invalid
  return rateLimitConfig.free;
}

// Constant for rate limit window duration
export const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

/**
 * Helper function to create rate limit info response
 * Requirement: System Performance - Efficient rate limit tracking
 * 
 * @param limit - Maximum requests allowed
 * @param remaining - Remaining requests
 * @param reset - Timestamp when the limit resets
 * @param tier - Subscription tier
 * @returns RateLimitInfo object
 */
export function createRateLimitInfo(
  limit: number,
  remaining: number,
  reset: number,
  tier: string
): RateLimitInfo {
  return {
    limit,
    remaining,
    reset,
    tier
  };
}

/**
 * Error messages for rate limiting
 * Requirement: Security Controls - Clear error communication
 */
export const RATE_LIMIT_ERROR_MESSAGES = {
  EXCEEDED: 'Rate limit exceeded. Please try again later.',
  BURST_EXCEEDED: 'Too many concurrent requests. Please slow down.',
  TIER_UPGRADE: 'Consider upgrading your subscription tier for higher limits.'
} as const;

/**
 * Rate limit error type
 * Requirement: System Performance - Error handling
 */
export const RATE_LIMIT_ERROR = AuthErrorCode.RATE_LIMIT_ERROR;
/**
 * Redis Cache Configuration
 * 
 * Human Tasks:
 * 1. Set up Redis server and ensure it's accessible
 * 2. Configure environment variables:
 *    - REDIS_HOST: Redis server hostname
 *    - REDIS_PORT: Redis server port
 *    - REDIS_PASSWORD: Redis authentication password (if required)
 *    - REDIS_TLS: Enable TLS encryption ('true' or 'false')
 * 3. Verify Redis connection with provided configuration
 */

// ioredis v5.0.0
import { Redis } from 'ioredis';
import { APIResponse } from '../types/api';

/**
 * Redis connection configuration interface
 * Requirement: Caching Strategy - Redis Cache Configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
}

/**
 * Cache TTL configuration in seconds
 * Requirement: Caching Strategy - Multi-Level Caching with Redis
 */
export interface CacheTTLConfig {
  apiResponse: number;  // 5 minutes TTL for API responses
  session: number;     // 24 hours TTL for sessions
  drillData: number;   // 1 hour TTL for drill data
}

/**
 * Cache key pattern definitions
 * Requirement: Caching Strategy - Cache Key Management
 */
export interface CacheKeyPatterns {
  apiResponse: string;
  session: string;
  drillData: string;
}

/**
 * Redis configuration with environment variable fallbacks
 * Requirement: System Performance - Efficient Cache Configuration
 */
export const REDIS_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  tls: process.env.REDIS_TLS === 'true'
};

/**
 * TTL configuration in seconds for different cache types
 * Requirement: Caching Strategy - Configurable TTLs
 */
export const CACHE_TTL: CacheTTLConfig = {
  apiResponse: 300,    // 5 minutes
  session: 86400,      // 24 hours
  drillData: 3600     // 1 hour
};

/**
 * Cache key patterns with namespace prefixes
 * Requirement: Caching Strategy - Cache Namespacing
 */
export const CACHE_KEY_PATTERNS: CacheKeyPatterns = {
  apiResponse: 'api:*',
  session: 'session:*',
  drillData: 'drill:*'
};

/**
 * Validates Redis configuration values
 * Requirement: System Performance - Reliable Cache Configuration
 * 
 * @param config - Redis configuration object to validate
 * @returns boolean indicating if configuration is valid
 */
export function validateRedisConfig(config: RedisConfig): boolean {
  // Validate host
  if (!config.host || config.host.trim().length === 0) {
    return false;
  }

  // Validate port range (1-65535)
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    return false;
  }

  // Validate db number
  if (!Number.isInteger(config.db) || config.db < 0) {
    return false;
  }

  return true;
}

/**
 * Centralized cache configuration object
 * Requirements:
 * - Caching Strategy - Multi-Level Caching with Redis
 * - System Performance - Support <200ms API response time
 */
export const cacheConfig = {
  redis: REDIS_CONFIG,
  ttl: CACHE_TTL,
  keyPatterns: CACHE_KEY_PATTERNS
};
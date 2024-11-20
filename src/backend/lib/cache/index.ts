/**
 * Human Tasks:
 * 1. Verify Redis connection string in environment configuration
 * 2. Ensure Redis server is accessible from the application environment
 * 3. Monitor cache memory usage and adjust maxSize if needed
 * 4. Set up error alerting for cache connection failures
 */

// @requirement: Cache Layer - Redis cache for API responses, session data, and drill data
// @requirement: Caching Strategy - Multi-level caching with Redis for specific TTLs
import { RedisCache } from './redis';
import { CacheConfig } from '../../types/config';

// Global singleton cache instance
let cacheInstance: RedisCache | null = null;

/**
 * Initializes and connects to the Redis cache instance with the provided configuration.
 * Implements singleton pattern to ensure only one cache instance exists throughout the application.
 * 
 * @param config - Cache configuration including Redis URL, TTLs, and size limits
 * @returns Promise<RedisCache> Connected Redis cache instance
 * @throws Error if connection fails or configuration is invalid
 */
export async function initializeCache(config: CacheConfig): Promise<RedisCache> {
  try {
    // Return existing instance if already initialized
    if (cacheInstance) {
      return cacheInstance;
    }

    // Validate required configuration
    if (!config.url || !config.ttl || !config.maxSize) {
      throw new Error('Invalid cache configuration. Required: url, ttl, maxSize');
    }

    // Create new cache instance
    const cache = new RedisCache(config);

    // Connect to Redis with retry logic built into RedisCache
    await cache.connect();

    // Store instance globally
    cacheInstance = cache;

    return cache;
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    throw new Error('Cache initialization failed');
  }
}

/**
 * Returns the initialized cache instance or throws if not initialized.
 * Ensures cache is ready before any operations are performed.
 * 
 * @returns RedisCache The initialized and connected cache instance
 * @throws Error if cache is not initialized
 */
export function getCacheInstance(): RedisCache {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache first.');
  }
  return cacheInstance;
}

// Re-export RedisCache class and its methods for external use
export { RedisCache };
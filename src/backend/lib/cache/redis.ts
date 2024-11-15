/**
 * Human Tasks:
 * 1. Ensure Redis server is properly configured and accessible
 * 2. Verify network security groups allow Redis port access
 * 3. Configure Redis persistence settings based on data criticality
 * 4. Set up Redis monitoring and alerting
 * 5. Review Redis memory allocation and maxmemory policy
 */

// @requirement: Cache Layer - Redis cache implementation for API responses, session data, and drill data
import Redis from 'ioredis'; // v5.3.0
import ms from 'ms'; // v2.1.3
import { CacheConfig } from '../../types/config';
import { CACHE_TTL } from '../../config/constants';

// Global Redis client instance
let redisClient: Redis | null = null;

// @requirement: Caching Strategy - Multi-level caching with Redis for API responses and session data
export class RedisCache {
  private client: Redis;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    // Validate configuration
    if (!config.url) {
      throw new Error('Redis URL is required in cache configuration');
    }

    this.config = config;

    // Initialize Redis client with robust configuration
    this.client = new Redis(config.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    // Set up error handling
    this.client.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.info('Successfully connected to Redis');
    });

    redisClient = this.client;
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  async set<T>(key: string, value: T, type: keyof typeof CACHE_TTL): Promise<void> {
    try {
      // Validate inputs
      if (!key || value === undefined) {
        throw new Error('Invalid key or value for cache');
      }

      // Get TTL for the specific cache type
      const ttl = this.config.ttl[type] || CACHE_TTL[type];
      if (!ttl) {
        throw new Error(`No TTL configured for cache type: ${type}`);
      }

      // Serialize value and store with expiration
      const serializedValue = JSON.stringify(value);
      await this.client.setex(key, ttl, serializedValue);
    } catch (error) {
      console.error('Cache set error:', error);
      throw new Error('Failed to set cache value');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Validate key
      if (!key) {
        throw new Error('Invalid cache key');
      }

      // Get and parse value
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch (parseError) {
        console.error('Cache value parse error:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      throw new Error('Failed to get cache value');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Validate key
      if (!key) {
        throw new Error('Invalid cache key');
      }

      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      throw new Error('Failed to delete cache value');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Cache clear error:', error);
      throw new Error('Failed to clear cache');
    }
  }
}
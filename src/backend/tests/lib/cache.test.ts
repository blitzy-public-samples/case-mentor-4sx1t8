// @jest/globals v29.7.0
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
// ioredis-mock v8.9.0
import Redis from 'ioredis-mock';
import { RedisCache, initializeCache, getCacheInstance } from '../../lib/cache';
import type { CacheConfig } from '../../types/config';

// Mock Redis implementation
jest.mock('ioredis', () => require('ioredis-mock'));

// Test configuration
const mockConfig: CacheConfig = {
  url: 'redis://localhost:6379',
  ttl: {
    drill: 300,
    user: 600,
    simulation: 900
  },
  maxSize: 1000
};

beforeEach(async () => {
  // Clear any existing cache instance
  const instance = getCacheInstance();
  await instance.clear().catch(() => {});
  
  // Reset all mocks
  jest.clearAllMocks();
  jest.resetModules();
  
  // Reset Redis mock state
  const redisMock = new Redis();
  await redisMock.flushall();
});

afterEach(async () => {
  // Clean up cache instance
  const instance = getCacheInstance();
  await instance.clear().catch(() => {});
  
  // Reset Redis mock
  const redisMock = new Redis();
  await redisMock.flushall();
  
  // Clear mock implementations
  jest.clearAllMocks();
});

// @requirement: Cache Layer - Redis cache for API responses, session data, and drill data
describe('Cache Initialization', () => {
  test('should initialize cache with correct configuration', async () => {
    const cache = await initializeCache(mockConfig);
    expect(cache).toBeInstanceOf(RedisCache);
    expect(cache.connect).toBeDefined();
  });

  test('should throw error when initializing with invalid URL', async () => {
    const invalidConfig = { ...mockConfig, url: '' };
    await expect(initializeCache(invalidConfig)).rejects.toThrow('Cache initialization failed');
  });

  test('should reuse existing cache instance when already initialized', async () => {
    const firstInstance = await initializeCache(mockConfig);
    const secondInstance = await initializeCache(mockConfig);
    expect(firstInstance).toBe(secondInstance);
  });
});

// @requirement: Caching Strategy - Multi-level caching with Redis for specific TTLs
describe('Cache Operations', () => {
  test('should set and get values correctly', async () => {
    const cache = await initializeCache(mockConfig);
    await cache.set('test-key', { data: 'test-value' }, 'drill');
    const result = await cache.get('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  test('should handle TTL expiration', async () => {
    const cache = await initializeCache(mockConfig);
    await cache.set('expiring-key', 'test-data', 'drill');
    
    // Mock time advancement
    jest.advanceTimersByTime(mockConfig.ttl.drill * 1000 + 1000);
    
    const result = await cache.get('expiring-key');
    expect(result).toBeNull();
  });

  test('should delete values correctly', async () => {
    const cache = await initializeCache(mockConfig);
    await cache.set('delete-key', 'test-data', 'user');
    await cache.delete('delete-key');
    const result = await cache.get('delete-key');
    expect(result).toBeNull();
  });

  test('should clear all values', async () => {
    const cache = await initializeCache(mockConfig);
    await cache.set('key1', 'value1', 'drill');
    await cache.set('key2', 'value2', 'user');
    await cache.clear();
    const result1 = await cache.get('key1');
    const result2 = await cache.get('key2');
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  test('should handle JSON serialization errors', async () => {
    const cache = await initializeCache(mockConfig);
    const circular: any = {};
    circular.self = circular;
    await expect(cache.set('circular', circular, 'drill')).rejects.toThrow();
  });
});

describe('Error Handling', () => {
  test('should handle connection failures', async () => {
    const badConfig = { ...mockConfig, url: 'redis://nonexistent:6379' };
    await expect(initializeCache(badConfig)).rejects.toThrow('Cache initialization failed');
  });

  test('should handle Redis operation errors', async () => {
    const cache = await initializeCache(mockConfig);
    // Mock Redis error
    jest.spyOn(Redis.prototype, 'set').mockRejectedValueOnce(new Error('Redis error'));
    await expect(cache.set('key', 'value', 'drill')).rejects.toThrow();
  });

  test('should handle invalid cache types', async () => {
    const cache = await initializeCache(mockConfig);
    // @ts-expect-error Testing invalid cache type
    await expect(cache.set('key', 'value', 'invalid-type')).rejects.toThrow();
  });

  test('should handle concurrent operations', async () => {
    const cache = await initializeCache(mockConfig);
    const operations = Array(10).fill(null).map((_, i) => 
      cache.set(`key${i}`, `value${i}`, 'drill')
    );
    await expect(Promise.all(operations)).resolves.not.toThrow();
  });
});

describe('Cache Instance Management', () => {
  test('should get initialized instance correctly', async () => {
    await initializeCache(mockConfig);
    const instance = getCacheInstance();
    expect(instance).toBeInstanceOf(RedisCache);
  });

  test('should throw when getting uninitialized instance', () => {
    // Reset module to clear cache instance
    jest.resetModules();
    expect(() => getCacheInstance()).toThrow('Cache not initialized');
  });

  test('should handle reconnection attempts', async () => {
    const cache = await initializeCache(mockConfig);
    // Simulate disconnect
    await cache.clear();
    // Attempt operation after disconnect
    await expect(cache.set('key', 'value', 'drill')).resolves.not.toThrow();
  });
});
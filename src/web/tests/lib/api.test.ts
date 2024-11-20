// @jest/globals ^29.7.0
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
// axios-mock-adapter ^1.22.0
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

import { api } from '../../lib/api';
import { APIResponse, APIError, ErrorCode, RateLimitInfo, PaginatedResponse } from '../../types/api';
import { API_CONFIG } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Configure test environment variables for API_CONFIG.BASE_URL
 * 2. Set up test data fixtures for different response scenarios
 * 3. Configure CI/CD pipeline to run these tests before deployment
 * 4. Set up test coverage reporting and monitoring
 */

// Initialize mock adapter
let mockAxios: MockAdapter;

beforeEach(() => {
  mockAxios = new MockAdapter(axios);
  jest.useFakeTimers();
});

afterEach(() => {
  mockAxios.reset();
  mockAxios.restore();
  jest.useRealTimers();
});

describe('API Client', () => {
  // Requirement: API Architecture - Tests standardized API client implementation
  describe('GET requests', () => {
    test('should handle successful GET request', async () => {
      const testData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).reply(200, testData, {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
        'x-ratelimit-reset': '1234567890'
      });

      const startTime = performance.now();
      const response = await api.get<typeof testData>(endpoint);
      const endTime = performance.now();

      // Requirement: System Performance - Validates API response time under 200ms
      expect(endTime - startTime).toBeLessThan(200);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.error).toBeNull();
    });

    test('should handle GET request with query parameters', async () => {
      const testData = { items: [1, 2, 3] };
      const endpoint = '/test';
      const params = { page: 1, limit: 10 };

      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`, { params }).reply(200, testData);

      const response = await api.get<typeof testData>(endpoint, params);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
    });
  });

  // Requirement: API Architecture - Tests error handling and response processing
  describe('POST requests', () => {
    test('should handle successful POST request', async () => {
      const payload = { name: 'Test Item' };
      const testData = { id: 1, ...payload };
      const endpoint = '/test';

      mockAxios.onPost(`${API_CONFIG.BASE_URL}${endpoint}`, payload).reply(200, testData);

      const startTime = performance.now();
      const response = await api.post<typeof testData>(endpoint, payload);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
    });

    test('should handle POST request validation error', async () => {
      const payload = { invalid: 'data' };
      const endpoint = '/test';
      const errorResponse: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { field: 'name', error: 'required' }
      };

      mockAxios.onPost(`${API_CONFIG.BASE_URL}${endpoint}`).reply(400, errorResponse);

      const response = await api.post<any>(endpoint, payload);
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  // Requirement: API Architecture - Tests PUT and DELETE methods
  describe('PUT and DELETE requests', () => {
    test('should handle successful PUT request', async () => {
      const payload = { id: 1, name: 'Updated' };
      const endpoint = '/test/1';

      mockAxios.onPut(`${API_CONFIG.BASE_URL}${endpoint}`, payload).reply(200, payload);

      const response = await api.put<typeof payload>(endpoint, payload);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(payload);
    });

    test('should handle successful DELETE request', async () => {
      const endpoint = '/test/1';
      const testData = { success: true };

      mockAxios.onDelete(`${API_CONFIG.BASE_URL}${endpoint}`).reply(200, testData);

      const response = await api.delete<typeof testData>(endpoint);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
    });
  });

  // Requirement: Rate Limiting - Tests rate limit handling and retry logic
  describe('Rate limiting and retries', () => {
    test('should handle rate limit errors with retry', async () => {
      const endpoint = '/test';
      const testData = { id: 1 };
      let attempts = 0;

      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).reply(() => {
        attempts++;
        if (attempts <= 2) {
          return [429, null, {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': (Date.now() + 1000).toString()
          }];
        }
        return [200, testData];
      });

      const response = await api.get<typeof testData>(endpoint);
      expect(attempts).toBe(3);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
    });

    test('should respect retry attempts limit', async () => {
      const endpoint = '/test';
      let attempts = 0;

      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).reply(() => {
        attempts++;
        return [429, {
          code: ErrorCode.RATE_LIMIT_ERROR,
          message: 'Rate limit exceeded',
          details: {}
        }];
      });

      const response = await api.get<any>(endpoint);
      expect(attempts).toBe(API_CONFIG.RETRY_ATTEMPTS + 1);
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
    });
  });

  // Requirement: API Architecture - Tests error handling scenarios
  describe('Error handling', () => {
    test('should handle network errors', async () => {
      const endpoint = '/test';
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).networkError();

      const response = await api.get<any>(endpoint);
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    test('should handle timeout errors', async () => {
      const endpoint = '/test';
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).timeout();

      const response = await api.get<any>(endpoint);
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    test('should handle authentication errors', async () => {
      const endpoint = '/test';
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${endpoint}`).reply(401, {
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Unauthorized',
        details: {}
      });

      const response = await api.get<any>(endpoint);
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
    });
  });
});
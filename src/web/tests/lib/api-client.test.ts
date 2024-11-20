// @jest/globals version: ^29.0.0
// msw version: ^1.0.0
// axios-mock-adapter version: ^1.21.0

import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { setupServer } from 'msw';
import { rest } from 'msw';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../../lib/api-client';
import { APIResponse, APIError } from '../../types/api';

/**
 * Human Tasks:
 * 1. Configure test environment variables in CI/CD pipeline
 * 2. Set up test data fixtures for different API scenarios
 * 3. Configure test timeouts for performance-sensitive tests
 * 4. Set up test coverage thresholds in Jest configuration
 */

// Mock API base URL for testing
const API_BASE_URL = 'http://api.test';
process.env.NEXT_PUBLIC_API_BASE_URL = API_BASE_URL;

// Initialize MSW server for API mocking
const mockServer = setupServer();

// Initialize Axios mock adapter
const mockAxios = new MockAdapter(axios);

describe('API Client', () => {
  beforeEach(() => {
    // Reset all mocks and interceptors before each test
    mockServer.listen({ onUnhandledRequest: 'error' });
    mockAxios.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    mockServer.close();
    mockAxios.restore();
  });

  /**
   * @requirement System Performance
   * Tests successful API request handling with response time validation
   */
  test('successful request', async () => {
    const testData = { id: 1, name: 'Test' };
    const startTime = Date.now();

    mockAxios.onGet(`${API_BASE_URL}/test`).reply(200, testData);

    const response = await apiClient.get<typeof testData>('/test');

    // Verify response structure and timing
    expect(response.success).toBe(true);
    expect(response.data).toEqual(testData);
    expect(response.error).toBeNull();
    expect(response.timestamp).toBeDefined();
    expect(Date.now() - startTime).toBeLessThan(200); // Performance requirement check
  });

  /**
   * @requirement API Design
   * Tests error handling with standardized error format
   */
  test('error handling', async () => {
    const errorResponse: APIError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { field: 'name', issue: 'required' },
      requestId: 'test-123'
    };

    mockAxios.onPost(`${API_BASE_URL}/test`).reply(400, errorResponse);

    const response = await apiClient.post<never>('/test', { invalid: 'data' });

    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error).toMatchObject(errorResponse);
    expect(response.timestamp).toBeDefined();
  });

  /**
   * @requirement API Design
   * Tests retry mechanism for failed requests
   */
  test('retry mechanism', async () => {
    const networkError = new Error('Network Error');
    let attempts = 0;

    mockAxios.onGet(`${API_BASE_URL}/test`).reply(() => {
      attempts++;
      if (attempts <= 3) {
        return [500, networkError];
      }
      return [200, { success: true }];
    });

    const response = await apiClient.get<{ success: boolean }>('/test', {}, { retry: true });

    expect(attempts).toBe(3); // Verify exact number of retry attempts
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe('INTERNAL_ERROR');
  });

  /**
   * @requirement API Design
   * Tests authentication header handling
   */
  test('authentication', async () => {
    const testToken = 'test-auth-token';
    const testData = { authenticated: true };

    // Mock auth token in request headers
    mockAxios.onGet(`${API_BASE_URL}/auth-test`).reply((config) => {
      const authHeader = config.headers?.Authorization;
      if (authHeader === `Bearer ${testToken}`) {
        return [200, testData];
      }
      return [401, { code: 'AUTHENTICATION_ERROR' }];
    });

    // Mock getCurrentSession to return test token
    jest.mock('../../lib/auth', () => ({
      getCurrentSession: () => Promise.resolve({ access_token: testToken })
    }));

    const response = await apiClient.get<typeof testData>('/auth-test');

    expect(response.success).toBe(true);
    expect(response.data).toEqual(testData);
    expect(mockAxios.history.get[0].headers?.Authorization).toBe(`Bearer ${testToken}`);
  });

  /**
   * @requirement System Performance
   * Tests caching mechanism for GET requests
   */
  test('request caching', async () => {
    const testData = { cached: true };
    let apiCalls = 0;

    mockAxios.onGet(`${API_BASE_URL}/cached`).reply(() => {
      apiCalls++;
      return [200, testData];
    });

    // First request should hit the API
    const response1 = await apiClient.get<typeof testData>('/cached', {}, { cache: true });
    // Second request should use cache
    const response2 = await apiClient.get<typeof testData>('/cached', {}, { cache: true });

    expect(response1.data).toEqual(testData);
    expect(response2.data).toEqual(testData);
    expect(apiCalls).toBe(1); // Verify only one actual API call was made
  });

  /**
   * @requirement API Design
   * Tests request cancellation
   */
  test('request cancellation', async () => {
    const controller = new AbortController();
    
    mockAxios.onGet(`${API_BASE_URL}/slow`).reply(() => {
      return new Promise((resolve) => setTimeout(resolve, 1000));
    });

    const requestPromise = apiClient.get('/slow', {}, { signal: controller.signal });
    controller.abort();

    await expect(requestPromise).rejects.toThrow('canceled');
  });

  /**
   * @requirement System Performance
   * Tests request timeout handling
   */
  test('request timeout', async () => {
    mockAxios.onGet(`${API_BASE_URL}/timeout`).reply(() => {
      return new Promise((resolve) => setTimeout(resolve, 1000));
    });

    const response = await apiClient.get('/timeout', {}, { timeout: 500 });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INTERNAL_ERROR');
    expect(response.error?.message).toContain('timeout');
  });
});
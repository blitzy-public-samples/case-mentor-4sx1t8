// axios version: ^1.0.0
// qs version: ^6.11.0

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { APIResponse, APIError } from '../types/api';
import { getCurrentSession } from './auth';
import { validateDrillResponse } from './validation';

/**
 * Human Tasks:
 * 1. Configure API rate limiting thresholds in deployment environment
 * 2. Set up API monitoring and alerting for response times
 * 3. Configure CDN caching rules for GET requests
 * 4. Set up proper CORS configuration in API gateway
 */

// Global configuration constants from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * @requirement API Design
 * Configuration interface for API requests
 */
interface RequestConfig extends AxiosRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  validateRequest?: boolean;
  cache?: boolean;
}

/**
 * @requirement System Performance, API Design
 * Creates and configures an axios instance with default settings
 */
function createAPIClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' })
  });

  // Request interceptor for authentication
  instance.interceptors.request.use(async (config) => {
    const session = await getCurrentSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return config;
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RequestConfig;
      
      // Implement retry logic for failed requests
      if (config?.retry && config.retryCount < MAX_RETRIES) {
        config.retryCount = (config.retryCount || 0) + 1;
        const delay = Math.pow(2, config.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return instance(config);
      }
      
      return Promise.reject(handleAPIError(error));
    }
  );

  return instance;
}

/**
 * @requirement API Design
 * Processes API errors into standardized format
 */
function handleAPIError(error: AxiosError): APIError {
  const response = error.response?.data as any;
  return {
    code: response?.code || 'INTERNAL_ERROR',
    message: response?.message || 'An unexpected error occurred',
    details: response?.details || {},
    requestId: error.config?.headers?.['X-Request-ID'] as string || `error-${Date.now()}`
  };
}

/**
 * @requirement System Performance
 * Manages response caching for GET requests
 */
function getCachedResponse<T>(cacheKey: string): APIResponse<T> | null {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(cacheKey);
  return null;
}

/**
 * @requirement System Performance, API Design
 * Generic request function with proper typing and error handling
 */
async function request<T>(
  method: string,
  url: string,
  data?: Record<string, any>,
  config: RequestConfig = {}
): Promise<APIResponse<T>> {
  // Check cache for GET requests
  if (method === 'GET' && config.cache) {
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
    const cached = getCachedResponse<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Validate request data if enabled
  if (config.validateRequest && data) {
    validateDrillResponse(data);
  }

  try {
    const response = await axiosInstance({
      method,
      url,
      ...(method === 'GET' ? { params: data } : { data }),
      ...config,
      retryCount: 0
    });

    const apiResponse: APIResponse<T> = {
      success: true,
      data: response.data,
      error: null,
      timestamp: new Date().toISOString()
    };

    // Cache successful GET responses
    if (method === 'GET' && config.cache) {
      const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
      cache.set(cacheKey, { data: apiResponse, timestamp: Date.now() });
    }

    return apiResponse;
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = handleAPIError(error);
      return {
        success: false,
        data: null as any,
        error: apiError,
        timestamp: new Date().toISOString()
      };
    }
    throw error;
  }
}

// Create singleton instance
const axiosInstance = createAPIClient();

/**
 * @requirement API Design
 * Exported API client with standardized request methods
 */
export const apiClient = {
  request,
  get: <T>(url: string, params?: Record<string, any>, config?: RequestConfig) =>
    request<T>('GET', url, params, { ...config, cache: config?.cache ?? true }),
  post: <T>(url: string, data?: Record<string, any>, config?: RequestConfig) =>
    request<T>('POST', url, data, config),
  put: <T>(url: string, data?: Record<string, any>, config?: RequestConfig) =>
    request<T>('PUT', url, data, config),
  delete: <T>(url: string, params?: Record<string, any>, config?: RequestConfig) =>
    request<T>('DELETE', url, params, config)
};
// axios ^1.6.0
import axios, { AxiosInstance, AxiosError } from 'axios';
// axios-retry ^3.8.0
import axiosRetry from 'axios-retry';

import { 
  APIResponse, 
  APIError, 
  ErrorCode, 
  RateLimitInfo, 
  PaginatedResponse 
} from '../types/api';
import { getCurrentUser } from './auth';
import { API_CONFIG, ERROR_MESSAGES } from '../config/constants';

/**
 * Human Tasks:
 * 1. Configure API rate limit thresholds in infrastructure
 * 2. Set up monitoring for API response times
 * 3. Configure retry backoff settings in production
 * 4. Set up proper error tracking and logging
 */

// Track rate limit info per endpoint
const rateLimitTracker = new Map<string, RateLimitInfo>();

/**
 * Creates and configures an Axios instance with default settings and interceptors
 * Requirement: API Architecture - Implements standardized API client
 */
const createAPIClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Configure retry logic with exponential backoff
  // Requirement: System Performance - Ensures API response time under 200ms for 95% of requests
  axiosRetry(client, {
    retries: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
             error.response?.status === 429;
    }
  });

  // Add authentication interceptor
  client.interceptors.request.use(async (config) => {
    const user = await getCurrentUser();
    if (user?.session) {
      config.headers.Authorization = `Bearer ${user.session.access_token}`;
    }
    return config;
  });

  // Add response interceptor for error handling and rate limit tracking
  // Requirement: Rate Limiting - Handles tier-based rate limiting
  client.interceptors.response.use(
    (response) => {
      // Track rate limit info from headers
      const endpoint = response.config.url || '';
      const rateLimitInfo: RateLimitInfo = {
        limit: parseInt(response.headers['x-ratelimit-limit'] || '0'),
        remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
        reset: parseInt(response.headers['x-ratelimit-reset'] || '0')
      };
      rateLimitTracker.set(endpoint, rateLimitInfo);
      return response;
    },
    (error: AxiosError) => {
      return Promise.reject(handleAPIError(error));
    }
  );

  return client;
};

/**
 * Processes API errors and converts them to standardized APIError responses
 * Requirement: API Architecture - Standardized error handling
 */
const handleAPIError = (error: AxiosError): APIError => {
  let code = ErrorCode.INTERNAL_ERROR;
  let message = ERROR_MESSAGES.API.SERVER;

  if (error.response) {
    switch (error.response.status) {
      case 400:
        code = ErrorCode.VALIDATION_ERROR;
        message = ERROR_MESSAGES.VALIDATION.INVALID_INPUT;
        break;
      case 401:
        code = ErrorCode.AUTHENTICATION_ERROR;
        message = ERROR_MESSAGES.AUTH.UNAUTHORIZED;
        break;
      case 429:
        code = ErrorCode.RATE_LIMIT_ERROR;
        message = ERROR_MESSAGES.API.RATE_LIMIT;
        break;
    }
  } else if (error.code === 'ECONNABORTED') {
    message = ERROR_MESSAGES.API.TIMEOUT;
  } else if (!error.response) {
    message = ERROR_MESSAGES.API.NETWORK;
  }

  return {
    code,
    message,
    details: error.response?.data || {}
  };
};

// Create API client instance
const apiClient = createAPIClient();

/**
 * Makes typed GET request with automatic retry and error handling
 * Requirement: API Architecture - Type safety and error handling
 */
async function get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await apiClient.get<T>(endpoint, { params });
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error as APIError
    };
  }
}

/**
 * Makes typed POST request with automatic retry and error handling
 * Requirement: API Architecture - Type safety and error handling
 */
async function post<T>(endpoint: string, data: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await apiClient.post<T>(endpoint, data);
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error as APIError
    };
  }
}

/**
 * Makes typed PUT request with automatic retry and error handling
 * Requirement: API Architecture - Type safety and error handling
 */
async function put<T>(endpoint: string, data: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await apiClient.put<T>(endpoint, data);
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error as APIError
    };
  }
}

/**
 * Makes typed DELETE request with automatic retry and error handling
 * Requirement: API Architecture - Type safety and error handling
 */
async function del<T>(endpoint: string): Promise<APIResponse<T>> {
  try {
    const response = await apiClient.delete<T>(endpoint);
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error as APIError
    };
  }
}

// Export configured API client methods
export const api = {
  get,
  post,
  put,
  delete: del
};
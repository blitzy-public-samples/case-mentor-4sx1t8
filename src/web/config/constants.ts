import { colors, breakpoints } from './theme';
import { dashboard } from './routes';

// Human Tasks:
// 1. Verify API base URL matches deployment environment
// 2. Confirm rate limits align with infrastructure capacity
// 3. Review subscription tier features with product team
// 4. Validate timeout and retry settings against monitoring data

// Requirement: System Performance - API response time targets and performance thresholds
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.caseprep.io',
  TIMEOUT: 10000, // 10 second timeout
  RETRY_ATTEMPTS: 3,
  PERFORMANCE_THRESHOLDS: {
    RESPONSE_TIME_P95: 200, // 95th percentile response time in ms
    ERROR_RATE_THRESHOLD: 0.01 // 1% error rate threshold
  }
} as const;

// Requirement: System Performance - Authentication configuration and token management
export const AUTH_CONFIG = {
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_THRESHOLD: 60 * 60 * 1000, // Refresh token 1 hour before expiry
  SESSION_STORAGE_KEY: 'case_prep_session',
  PERSISTENT_LOGIN_DAYS: 7
} as const;

// Requirement: Core Features - Practice drill configuration
export const DRILL_CONFIG = {
  TIME_LIMITS: {
    CASE_PROMPT: 15 * 60, // 15 minutes
    MARKET_SIZING: 10 * 60, // 10 minutes
    CALCULATIONS: 5 * 60, // 5 minutes
    BRAINSTORMING: 8 * 60 // 8 minutes
  },
  ATTEMPT_LIMITS: {
    FREE_TIER: {
      DAILY: 2,
      MONTHLY: 20
    },
    BASIC_TIER: {
      DAILY: 5,
      MONTHLY: 50
    },
    PREMIUM_TIER: {
      DAILY: Infinity,
      MONTHLY: Infinity
    }
  },
  FEEDBACK_DELAY: 30 * 1000 // 30 seconds for AI feedback generation
} as const;

// Requirement: Core Features - McKinsey simulation configuration
export const SIMULATION_CONFIG = {
  MAX_SPECIES: 8,
  TIME_LIMIT: 45 * 60, // 45 minutes
  MIN_PRODUCERS: 3,
  MAX_PRODUCERS: 5,
  MIN_CONSUMERS: 3,
  MAX_CONSUMERS: 5,
  ENVIRONMENT_PARAMS: {
    TEMPERATURE_RANGE: { MIN: 15, MAX: 30 }, // °C
    DEPTH_RANGE: { MIN: 0, MAX: 100 }, // meters
    SALINITY_RANGE: { MIN: 30, MAX: 40 } // ppt
  }
} as const;

// Requirement: Core Features - Subscription tier features and limits
export const SUBSCRIPTION_TIERS = {
  FREE: {
    NAME: 'Free',
    PRICE: 0,
    FEATURES: [
      'Limited drill attempts',
      'Basic progress tracking',
      'Demo simulation access'
    ],
    COLOR: colors.primary.base
  },
  BASIC: {
    NAME: 'Basic',
    PRICE: 29.99,
    FEATURES: [
      'Increased drill attempts',
      'Detailed feedback',
      'Basic simulation access',
      'Progress analytics'
    ],
    COLOR: colors.secondary.base
  },
  PREMIUM: {
    NAME: 'Premium',
    PRICE: 99.99,
    FEATURES: [
      'Unlimited drill attempts',
      'Priority AI feedback',
      'Full simulation access',
      'Advanced analytics',
      'Priority support'
    ],
    COLOR: colors.accent.base
  }
} as const;

// Requirement: Rate Limiting - API request quotas per subscription tier
export const RATE_LIMITS = {
  FREE: {
    REQUESTS_PER_MINUTE: 20,
    REQUESTS_PER_HOUR: 100,
    CONCURRENT_REQUESTS: 2,
    BURST_LIMIT: 5
  },
  BASIC: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 300,
    CONCURRENT_REQUESTS: 5,
    BURST_LIMIT: 10
  },
  PREMIUM: {
    REQUESTS_PER_MINUTE: 120,
    REQUESTS_PER_HOUR: 1000,
    CONCURRENT_REQUESTS: 10,
    BURST_LIMIT: 20
  }
} as const;

// Standardized error messages for consistent user feedback
export const ERROR_MESSAGES = {
  API: {
    TIMEOUT: 'Request timed out. Please try again.',
    RATE_LIMIT: 'Rate limit exceeded. Please wait before trying again.',
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Our team has been notified.'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You do not have access to this resource.'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PASSWORD: 'Password must be at least 8 characters long.',
    INVALID_INPUT: 'Please check your input and try again.'
  }
} as const;
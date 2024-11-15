// Human Tasks:
// 1. Verify OpenAI API key is set in environment variables
// 2. Confirm rate limit values align with infrastructure capacity
// 3. Review security headers with security team
// 4. Validate cache TTL values against usage patterns
// 5. Ensure authentication cookie settings comply with security policy

import { DrillType, DrillDifficulty } from '../types/drills';
import type { AppConfig } from '../types/config';

// @requirement: System Configuration - Core configuration values for NextJS Edge Functions
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;

// @requirement: System Configuration - Time limits for different drill types
export const DRILL_TIME_LIMITS: Record<DrillType, number> = {
  [DrillType.CASE_PROMPT]: 30, // 30 minutes
  [DrillType.CALCULATION]: 15, // 15 minutes
  [DrillType.CASE_MATH]: 20, // 20 minutes
  [DrillType.BRAINSTORMING]: 25, // 25 minutes
  [DrillType.MARKET_SIZING]: 20, // 20 minutes
  [DrillType.SYNTHESIZING]: 30, // 30 minutes
};

// @requirement: Rate Limiting - Configuration for different subscription tiers
export const RATE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    'drills/attempt': 10, // attempts per day
    'simulation/start': 2, // simulations per day
    'api/requests': 100 // requests per hour
  },
  basic: {
    'drills/attempt': 30,
    'simulation/start': 5,
    'api/requests': 300
  },
  premium: {
    'drills/attempt': 100,
    'simulation/start': 15,
    'api/requests': 1000
  }
};

// @requirement: System Configuration - Cache time-to-live values
export const CACHE_TTL: Record<string, number> = {
  drill: 3600, // 1 hour
  user: 1800, // 30 minutes
  simulation: 7200 // 2 hours
};

// @requirement: Security Controls - Security headers configuration
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// @requirement: Security Controls - Authentication constants
export const AUTH_CONSTANTS = {
  TOKEN_EXPIRY: 86400, // 24 hours in seconds
  REFRESH_WINDOW: 604800, // 7 days in seconds
  COOKIE_NAME: 'case-practice-session'
} as const;

// @requirement: System Configuration - OpenAI configuration
export const OPENAI_CONFIG = {
  MODEL: 'gpt-4',
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7
} as const;
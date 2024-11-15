/**
 * Human Tasks:
 * 1. Ensure environment variables are properly set in .env files for all configurations
 * 2. Update rate limit values in production based on infrastructure capacity
 * 3. Configure proper CORS origins for different environments
 * 4. Set appropriate JWT expiry times based on security requirements
 * 5. Review and adjust cache TTL values based on usage patterns
 */

// @requirement: Type System - TypeScript 5.0+ for strong typing and enhanced IDE support
// Core environment configuration interface
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
}

// @requirement: System Configuration - Configuration interfaces for NextJS Edge Functions and backend services
// Database configuration for Supabase PostgreSQL
export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  backupFrequency: string;
}

// Redis cache configuration interface
export interface CacheConfig {
  url: string;
  ttl: Record<string, number>;
  maxSize: number;
}

// OpenAI service configuration
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

// Stripe payment service configuration
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceIds: Record<string, string>;
}

// Resend email service configuration
export interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  templates: Record<string, string>;
}

// @requirement: Security Configuration - Type definitions for security and authentication configuration
// Authentication configuration for JWT and sessions
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: number;
  refreshWindow: number;
  cookieName: string;
}

// Rate limiting configuration per subscription tier
export interface RateLimitConfig {
  free: Record<string, number>;
  basic: Record<string, number>;
  premium: Record<string, number>;
}

// Security configuration for CORS and headers
export interface SecurityConfig {
  corsOrigins: string[];
  headers: Record<string, string>;
}

// Root application configuration interface
export interface AppConfig {
  env: EnvironmentConfig;
  db: DatabaseConfig;
  cache: CacheConfig;
  openai: OpenAIConfig;
  stripe: StripeConfig;
  email: EmailConfig;
  auth: AuthConfig;
  rateLimits: RateLimitConfig;
  security: SecurityConfig;
}
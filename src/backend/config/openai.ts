/**
 * Human Tasks:
 * 1. Set up OPENAI_API_KEY in environment variables (.env file)
 * 2. Configure OPENAI_MODEL in environment if different from default gpt-4
 * 3. Adjust OPENAI_MAX_TOKENS based on usage patterns and cost considerations
 * 4. Monitor and adjust OPENAI_TEMPERATURE based on response quality needs
 */

// @requirement: AI Evaluation - Core Services: AI evaluation for providing consistent, objective feedback
import { OpenAI } from 'openai'; // v4.0.0
import { OpenAIConfig } from '../types/config';

// Global constants for OpenAI configuration defaults
const DEFAULT_MODEL = 'gpt-4';
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Validates OpenAI API key format and presence
 * @param apiKey - The OpenAI API key to validate
 * @returns boolean indicating whether the API key is valid
 */
const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Validate key format: should start with 'sk-' and be at least 32 chars
  return apiKey.startsWith('sk-') && apiKey.length >= 32;
};

/**
 * Creates and validates OpenAI configuration from environment variables
 * @returns OpenAIConfig object with validated settings
 * @throws Error if API key is invalid or missing
 */
const createOpenAIConfig = (): OpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid or missing OpenAI API key. Must start with "sk-" and be at least 32 characters long.');
  }

  // @requirement: System Performance - <200ms API response time for 95% of requests
  // Configure optimal token limits and model settings for performance
  return {
    apiKey,
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    maxTokens: process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS, 10) : DEFAULT_MAX_TOKENS,
  };
};

// @requirement: Rate Limiting - Tiered API rate limits for OpenAI service access
// Initialize OpenAI configuration with validation
export const openaiConfig = createOpenAIConfig();

// Initialize OpenAI client with validated configuration
export const openaiClient = new OpenAI({
  apiKey: openaiConfig.apiKey,
  maxRetries: 3, // Add retries for reliability
  timeout: 30000, // 30 second timeout
  // Configure rate limiting at the client level
  maxConcurrency: 5, // Limit concurrent requests
});
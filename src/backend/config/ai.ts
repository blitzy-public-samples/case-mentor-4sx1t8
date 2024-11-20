/**
 * AI Configuration Module
 * 
 * Human Tasks Required:
 * 1. Set up OpenAI API key in environment variables
 * 2. Verify model names and token limits match your OpenAI subscription tier
 * 3. Monitor and adjust performance parameters based on production metrics
 */

// OpenAI SDK v4.0.0
import { OpenAI } from 'openai';
import { DrillCategory } from '../types/drills';

/**
 * Requirement: AI evaluation - Model configuration interface
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

/**
 * Requirement: AI evaluation - Global AI service configuration
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface AIConfig {
  maxRetries: number;
  timeout: number;
  streamingEnabled: boolean;
  modelConfigs: Record<DrillCategory, ModelConfig>;
}

/**
 * Requirement: System Performance - Default model configuration
 * Location: 2. SYSTEM OVERVIEW/Success Criteria
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
};

/**
 * Requirement: AI evaluation - Drill-specific optimized configurations
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export const DRILL_MODEL_CONFIGS: Record<DrillCategory, ModelConfig> = {
  [DrillCategory.CASE_PROMPT]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.8,
    maxTokens: 3072,
    presencePenalty: 0.1,
  },
  [DrillCategory.CALCULATIONS]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.2,
    maxTokens: 1024,
    presencePenalty: 0.2,
  },
  [DrillCategory.CASE_MATH]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.3,
    maxTokens: 1536,
    presencePenalty: 0.1,
  },
  [DrillCategory.BRAINSTORMING]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.9,
    maxTokens: 2048,
    presencePenalty: 0.2,
    frequencyPenalty: 0.3,
  },
  [DrillCategory.MARKET_SIZING]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.6,
    maxTokens: 2048,
    presencePenalty: 0.1,
  },
  [DrillCategory.SYNTHESIZING]: {
    ...DEFAULT_MODEL_CONFIG,
    temperature: 0.7,
    maxTokens: 4096,
    presencePenalty: 0.15,
    frequencyPenalty: 0.1,
  },
};

/**
 * Requirement: System Performance - Model configuration validation
 * Location: 2. SYSTEM OVERVIEW/Success Criteria
 */
export function validateModelConfig(config: ModelConfig): boolean {
  const SUPPORTED_MODELS = ['gpt-4', 'gpt-4-32k', 'gpt-3.5-turbo'];
  const MAX_TOKENS_LIMITS: Record<string, number> = {
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-3.5-turbo': 4096,
  };

  if (!SUPPORTED_MODELS.includes(config.model)) {
    return false;
  }

  if (config.temperature < 0 || config.temperature > 1) {
    return false;
  }

  if (config.maxTokens <= 0 || config.maxTokens > MAX_TOKENS_LIMITS[config.model]) {
    return false;
  }

  if (config.topP < 0 || config.topP > 1) {
    return false;
  }

  if (config.presencePenalty < -2 || config.presencePenalty > 2) {
    return false;
  }

  if (config.frequencyPenalty < -2 || config.frequencyPenalty > 2) {
    return false;
  }

  return true;
}

/**
 * Requirement: AI evaluation - Drill-specific model configuration retrieval
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export function getModelConfig(category: DrillCategory): ModelConfig {
  // Validate category exists
  if (!Object.values(DrillCategory).includes(category)) {
    throw new Error(`Invalid drill category: ${category}`);
  }

  // Get category-specific config with fallback to defaults
  const config: ModelConfig = {
    ...DEFAULT_MODEL_CONFIG,
    ...DRILL_MODEL_CONFIGS[category],
  };

  // Validate final configuration
  if (!validateModelConfig(config)) {
    throw new Error(`Invalid model configuration for category: ${category}`);
  }

  return config;
}
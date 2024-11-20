// Third-party imports
import { z } from 'zod'; // ^3.22.0

// Import drill validation functions and schemas
import {
  validateDrillPrompt,
  validateDrillResponse,
  validateDrillEvaluation,
  DRILL_PROMPT_SCHEMA,
  DRILL_ATTEMPT_SCHEMA,
  DRILL_EVALUATION_SCHEMA
} from './drills';

// Import simulation validation functions and schemas
import {
  validateSpecies,
  validateEnvironment,
  validateInteraction,
  validateSimulationState,
  simulationSchemas
} from './simulation';

// Import user validation functions and schemas
import {
  validateUserRegistration,
  validateProfileUpdate,
  validateSubscriptionUpdate,
  userRegistrationSchema,
  userProfileSchema,
  subscriptionUpdateSchema
} from './users';

// Human Tasks:
// 1. Monitor validation performance metrics across all modules
// 2. Set up centralized error tracking for validation failures
// 3. Review and update validation rules based on production feedback
// 4. Ensure consistent error handling patterns across validation modules

/**
 * @fileoverview Centralized validation module that exports all validation functions and schemas
 * Requirements addressed:
 * - Input Validation (7. SYSTEM DESIGN/7.3 API Design/7.3.6 Security Controls)
 * - Security Controls (8. SECURITY CONSIDERATIONS/8.3 SECURITY PROTOCOLS/8.3.3 Input Validation)
 */

/**
 * Drill validation functions and schemas
 * Requirement: Input Validation - JSON Schema validation for API endpoints
 */
export const drillValidation = {
  validateDrillPrompt,
  validateDrillResponse,
  validateDrillEvaluation,
  DRILL_PROMPT_SCHEMA,
  DRILL_ATTEMPT_SCHEMA,
  DRILL_EVALUATION_SCHEMA
} as const;

/**
 * Simulation validation functions and schemas
 * Requirement: Security Controls - Comprehensive input validation across all data types
 */
export const simulationValidation = {
  validateSpecies,
  validateEnvironment,
  validateInteraction,
  validateSimulationState,
  simulationSchemas
} as const;

/**
 * User validation functions and schemas
 * Requirement: Input Validation - JSON Schema validation for user data
 */
export const userValidation = {
  validateUserRegistration,
  validateProfileUpdate,
  validateSubscriptionUpdate,
  userRegistrationSchema,
  userProfileSchema,
  subscriptionUpdateSchema
} as const;
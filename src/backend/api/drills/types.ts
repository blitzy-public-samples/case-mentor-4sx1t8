/**
 * TypeScript type definitions for drill-related API requests and responses
 * Addresses the following requirements:
 * - Practice Drills: Define request/response types for all drill types
 * - API Layer: Support API endpoint type definitions with <200ms response time target
 */

import { 
  DrillTemplate, 
  DrillType, 
  DrillDifficulty 
} from '../../types/drills';

import {
  APIResponse,
  PaginatedResponse
} from '../../types/api';

/**
 * Interface for drill listing request parameters with pagination and filters
 * Requirement: Practice Drills - Support filtered drill listings
 */
export interface DrillListRequest {
  category?: DrillType;
  difficulty?: DrillDifficulty;
  page: number;
  limit: number;
}

/**
 * Interface for submitting a drill attempt with user response
 * Requirement: Practice Drills - Support drill attempt submissions
 */
export interface DrillAttemptRequest {
  drillId: string;
  response: Record<string, any>;
  timeSpent: number;
}

/**
 * Interface for requesting detailed feedback on a drill attempt
 * Requirement: Practice Drills - Comprehensive feedback system
 */
export interface DrillFeedbackRequest {
  attemptId: string;
}

/**
 * Type for paginated drill list response with drill templates
 * Requirement: API Layer - Standardized paginated responses
 */
export type DrillListResponse = PaginatedResponse<DrillTemplate>;

/**
 * Type for drill attempt submission response with scoring
 * Requirement: Practice Drills - Immediate scoring feedback
 */
export type DrillAttemptResponse = APIResponse<{
  attemptId: string;
  score: number | null;
  feedback: string | null;
}>;

/**
 * Type for detailed drill feedback response with scoring criteria
 * Requirement: Practice Drills - Detailed performance feedback
 */
export type DrillFeedbackResponse = APIResponse<{
  feedback: string;
  criteriaScores: Record<string, number>;
  improvementAreas: string[];
}>;
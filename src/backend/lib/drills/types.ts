// @ts-check
import { z } from 'zod'; // ^3.22.0
import { DrillType, DrillResponse, DrillEvaluation } from '../../types/drills';

// Human Tasks:
// 1. Verify evaluation criteria weights sum to 100% for each drill type
// 2. Review and validate AI feedback generation parameters
// 3. Ensure metrics thresholds align with business KPIs
// 4. Set up monitoring for evaluation accuracy and feedback quality

/**
 * @fileoverview Type definitions for drill evaluation system and metrics
 * Requirements addressed:
 * - AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
 * - Practice Drills (3. SCOPE/Core Features/Practice Drills)
 */

/**
 * Interface defining standardized evaluation criteria for all drill types
 * Requirement: AI Evaluation - Standardized assessment framework
 */
export interface DrillEvaluationCriteria {
    drillType: DrillType;
    rubric: EvaluationRubric;
    weights: Record<string, number>;
}

/**
 * Interface for detailed scoring rubric
 * Requirement: Practice Drills - Comprehensive evaluation criteria
 */
export interface EvaluationRubric {
    criteria: string[];
    scoringGuide: Record<string, string>;
    maxScore: number;
}

/**
 * Interface for quantitative performance metrics
 * Requirement: AI Evaluation - Objective performance measurement
 */
export interface DrillMetrics {
    timeSpent: number;
    completeness: number;
    accuracy: number;
    speed: number;
}

/**
 * Interface for AI-generated structured feedback
 * Requirement: AI Evaluation - Detailed feedback generation
 */
export interface DrillFeedback {
    strengths: string[];
    improvements: string[];
    detailedFeedback: Record<string, string>;
}

/**
 * Comprehensive result structure for completed drills
 * Requirement: Practice Drills - Complete assessment output
 */
export interface DrillResult {
    evaluation: DrillEvaluation;
    metrics: DrillMetrics;
    feedback: DrillFeedback;
}

/**
 * Zod schema for validation of evaluation criteria
 * Requirement: AI Evaluation - Runtime type safety
 */
export const EVALUATION_CRITERIA_SCHEMA = z.object({
    drillType: z.nativeEnum(DrillType),
    rubric: z.object({
        criteria: z.array(z.string()),
        scoringGuide: z.record(z.string()),
        maxScore: z.number()
    }),
    weights: z.record(z.number())
});

/**
 * Zod schema for validation of performance metrics
 * Requirement: AI Evaluation - Metrics validation
 */
export const METRICS_SCHEMA = z.object({
    timeSpent: z.number(),
    completeness: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
    speed: z.number().min(0).max(100)
});
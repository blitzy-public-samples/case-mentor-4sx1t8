// @ts-check
import { z } from 'zod'; // ^3.22.0
import { 
  DrillType, 
  DrillDifficulty, 
  DrillStatus, 
  DrillPrompt, 
  DrillAttempt, 
  DrillEvaluation 
} from '../../types/drills';
import { 
  DrillEvaluationCriteria, 
  DrillMetrics 
} from '../drills/types';
import { validateDrillAttempt } from '../../utils/validation';

// Human Tasks:
// 1. Configure monitoring for validation performance metrics
// 2. Set up alerts for validation failure rates
// 3. Review and adjust content length limits based on user feedback
// 4. Verify time limit configurations match business requirements

/**
 * @fileoverview Validation schemas and functions for drill-related data structures
 * Requirements addressed:
 * - Practice Drills (3. SCOPE/Core Features/Practice Drills)
 * - User Engagement (2. SYSTEM OVERVIEW/Success Criteria)
 */

/**
 * Schema for validating drill prompts
 * Requirement: Practice Drills - Validation for drill content and structure
 */
export const DRILL_PROMPT_SCHEMA = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(DrillType),
  difficulty: z.nativeEnum(DrillDifficulty),
  content: z.string().min(1),
  timeLimit: z.number().min(60).max(3600),
  industry: z.string()
});

/**
 * Schema for validating drill attempts
 * Requirement: User Engagement - Track completion rates and time spent
 */
export const DRILL_ATTEMPT_SCHEMA = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  drillId: z.string().uuid(),
  status: z.nativeEnum(DrillStatus),
  response: z.string(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  timeSpent: z.number().min(0)
});

/**
 * Schema for validating drill evaluations
 * Requirement: Practice Drills - Standardized evaluation format
 */
export const DRILL_EVALUATION_SCHEMA = z.object({
  attemptId: z.string().uuid(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  evaluatedAt: z.date()
});

/**
 * Validates drill prompt data against schema requirements
 * Requirement: Practice Drills - Data integrity for drill content
 */
export async function validateDrillPrompt(drillPrompt: any): Promise<boolean> {
  try {
    await DRILL_PROMPT_SCHEMA.parseAsync(drillPrompt);

    // Validate content length based on drill type
    const minContentLength: Record<DrillType, number> = {
      [DrillType.CASE_PROMPT]: 200,
      [DrillType.CALCULATION]: 50,
      [DrillType.CASE_MATH]: 100,
      [DrillType.BRAINSTORMING]: 100,
      [DrillType.MARKET_SIZING]: 150,
      [DrillType.SYNTHESIZING]: 200
    };

    if (drillPrompt.content.length < minContentLength[drillPrompt.type]) {
      throw new Error(`Content length too short for ${drillPrompt.type} drill type`);
    }

    // Validate time limit based on difficulty
    const maxTimeLimits: Record<DrillDifficulty, number> = {
      [DrillDifficulty.BEGINNER]: 1800,     // 30 minutes
      [DrillDifficulty.INTERMEDIATE]: 2700,  // 45 minutes
      [DrillDifficulty.ADVANCED]: 3600      // 60 minutes
    };

    if (drillPrompt.timeLimit > maxTimeLimits[drillPrompt.difficulty]) {
      throw new Error(`Time limit exceeds maximum for ${drillPrompt.difficulty} difficulty`);
    }

    return true;
  } catch (error) {
    throw new Error(`Drill prompt validation failed: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}

/**
 * Validates user's drill response based on type requirements
 * Requirement: Practice Drills - Type-specific validation rules
 */
export async function validateDrillResponse(drillResponse: any, drillType: DrillType): Promise<boolean> {
  try {
    // Type-specific response validation schemas
    const responseSchemas: Record<DrillType, z.ZodType> = {
      [DrillType.CASE_PROMPT]: z.object({
        analysis: z.string().min(200),
        recommendations: z.array(z.string()).min(1),
        implementation: z.string().min(100)
      }),
      [DrillType.CALCULATION]: z.object({
        workings: z.string().min(50),
        result: z.number(),
        assumptions: z.array(z.string())
      }),
      [DrillType.CASE_MATH]: z.object({
        calculations: z.array(z.string()).min(1),
        finalAnswer: z.number(),
        methodology: z.string().min(50)
      }),
      [DrillType.BRAINSTORMING]: z.object({
        ideas: z.array(z.string()).min(3),
        evaluation: z.string().min(100)
      }),
      [DrillType.MARKET_SIZING]: z.object({
        assumptions: z.array(z.string()).min(2),
        calculations: z.string().min(100),
        conclusion: z.number()
      }),
      [DrillType.SYNTHESIZING]: z.object({
        summary: z.string().min(150),
        keyInsights: z.array(z.string()).min(3),
        conclusion: z.string().min(100)
      })
    };

    await responseSchemas[drillType].parseAsync(drillResponse);
    return true;
  } catch (error) {
    throw new Error(`Drill response validation failed: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}

/**
 * Validates drill evaluation data including scores and feedback
 * Requirement: Practice Drills - Comprehensive evaluation validation
 */
export async function validateDrillEvaluation(drillEvaluation: any): Promise<boolean> {
  try {
    await DRILL_EVALUATION_SCHEMA.parseAsync(drillEvaluation);

    // Validate evaluation metrics
    const metricsSchema = z.object({
      timeSpent: z.number().min(0),
      completeness: z.number().min(0).max(100),
      accuracy: z.number().min(0).max(100),
      speed: z.number().min(0).max(100)
    });

    if (drillEvaluation.metrics) {
      await metricsSchema.parseAsync(drillEvaluation.metrics);
    }

    // Validate feedback components
    if (drillEvaluation.strengths.length === 0) {
      throw new Error('At least one strength must be provided');
    }

    if (drillEvaluation.improvements.length === 0) {
      throw new Error('At least one improvement area must be provided');
    }

    return true;
  } catch (error) {
    throw new Error(`Drill evaluation validation failed: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}
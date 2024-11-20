// @ts-check
import { z } from 'zod'; // ^3.22.0
import { User } from './user';

// Human Tasks:
// 1. Ensure database schema matches these type definitions
// 2. Configure appropriate time limits for different drill types
// 3. Verify industry categories align with business requirements
// 4. Set up monitoring for drill completion rates to track >80% target

/**
 * @fileoverview Core type definitions for practice drill system
 * Requirements addressed:
 * - Practice Drills (3. SCOPE/Core Features/Practice Drills)
 * - User Engagement (2. SYSTEM OVERVIEW/Success Criteria)
 */

/**
 * Enumeration of available drill types
 * Requirement: Practice Drills - Various drill types for comprehensive preparation
 */
export enum DrillType {
    CASE_PROMPT = 'CASE_PROMPT',
    CALCULATION = 'CALCULATION',
    CASE_MATH = 'CASE_MATH',
    BRAINSTORMING = 'BRAINSTORMING',
    MARKET_SIZING = 'MARKET_SIZING',
    SYNTHESIZING = 'SYNTHESIZING'
}

/**
 * Enumeration of drill difficulty levels
 * Requirement: Practice Drills - Progressive learning path
 */
export enum DrillDifficulty {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED'
}

/**
 * Enumeration of drill attempt statuses
 * Requirement: User Engagement - Track completion rates
 */
export enum DrillStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    EVALUATED = 'EVALUATED'
}

/**
 * Interface for drill prompts and questions
 * Requirement: Practice Drills - Structured practice content
 */
export interface DrillPrompt {
    id: string;
    type: DrillType;
    difficulty: DrillDifficulty;
    content: string;
    timeLimit: number;
    industry: string;
}

/**
 * Interface for tracking user attempts at practice drills
 * Requirement: User Engagement - Track user progress and completion
 */
export interface DrillAttempt {
    id: string;
    userId: string;
    drillId: string;
    status: DrillStatus;
    response: string;
    startedAt: Date;
    completedAt: Date | null;
    timeSpent: number;
}

/**
 * Interface for structured evaluation and feedback
 * Requirement: Practice Drills - Comprehensive feedback system
 */
export interface DrillEvaluation {
    attemptId: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    evaluatedAt: Date;
}

/**
 * Generic response structure for drill operations
 * Requirement: Practice Drills - Standardized response handling
 */
export interface DrillResponse<T> {
    success: boolean;
    data: T;
    error: string | null;
}

// Zod schemas for runtime validation

export const drillPromptSchema = z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(DrillType),
    difficulty: z.nativeEnum(DrillDifficulty),
    content: z.string().min(1),
    timeLimit: z.number().int().positive(),
    industry: z.string().min(1)
});

export const drillAttemptSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    drillId: z.string().uuid(),
    status: z.nativeEnum(DrillStatus),
    response: z.string(),
    startedAt: z.date(),
    completedAt: z.date().nullable(),
    timeSpent: z.number().min(0)
});

export const drillEvaluationSchema = z.object({
    attemptId: z.string().uuid(),
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    evaluatedAt: z.date()
});

export const drillResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema,
        error: z.string().nullable()
    });
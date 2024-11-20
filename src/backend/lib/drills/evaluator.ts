// Human Tasks:
// 1. Monitor evaluation response times to ensure <200ms SLA
// 2. Set up error tracking for failed evaluations
// 3. Configure alerting for timeout occurrences
// 4. Review and adjust timeout values based on performance metrics
// 5. Validate evaluation criteria weights across drill types

import { z } from 'zod'; // ^3.22.0
import {
  DrillType,
  DrillEvaluationCriteria,
  DrillResult,
  DrillMetrics,
  METRICS_SCHEMA
} from './types';
import { evaluateDrillResponse } from '../openai';
import { openaiConfig } from '../../config/openai';

// Global constants from specification
const EVALUATION_TIMEOUT = 30000;
const MAX_RESPONSE_LENGTH = 8000;

// Validation schemas for evaluation results
const DRILL_RESULT_SCHEMA = z.object({
  evaluation: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    evaluatedAt: z.date()
  }),
  metrics: METRICS_SCHEMA,
  feedback: z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    detailedFeedback: z.record(z.string())
  })
});

/**
 * Main function to evaluate a user's drill attempt using AI
 * @requirement AI Evaluation - Provides consistent, objective feedback through AI evaluation
 */
export async function evaluateDrillAttempt(
  drillType: DrillType,
  prompt: string,
  response: string,
  criteria: DrillEvaluationCriteria
): Promise<DrillResult> {
  // Validate response length
  if (response.length > MAX_RESPONSE_LENGTH) {
    throw new Error(`Response exceeds maximum length of ${MAX_RESPONSE_LENGTH} characters`);
  }

  // Calculate initial metrics
  const timeSpent = Date.now(); // Start time tracking
  const metrics = calculateDrillMetrics(response, timeSpent, drillType);

  try {
    // Evaluate with OpenAI with timeout
    const evaluationPromise = evaluateDrillResponse(drillType, response, criteria);
    const evaluation = await Promise.race([
      evaluationPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), EVALUATION_TIMEOUT)
      )
    ]);

    // Validate evaluation result
    if (!validateEvaluation(evaluation, criteria)) {
      throw new Error('Invalid evaluation result');
    }

    // Construct final result
    const result: DrillResult = {
      evaluation,
      metrics,
      feedback: {
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        detailedFeedback: criteria.rubric.criteria.reduce((acc, criterion, index) => ({
          ...acc,
          [criterion]: evaluation.feedback[index] || ''
        }), {})
      }
    };

    // Validate final result structure
    DRILL_RESULT_SCHEMA.parse(result);
    return result;

  } catch (error) {
    // Log error for monitoring
    console.error('Drill evaluation failed:', error);
    throw error;
  }
}

/**
 * Calculates standardized performance metrics for a drill attempt
 * @requirement Practice Drills - Evaluation system for various drill types
 */
export function calculateDrillMetrics(
  response: string,
  timeSpent: number,
  drillType: DrillType
): DrillMetrics {
  // Calculate base metrics
  const completeness = Math.min(
    (response.length / MAX_RESPONSE_LENGTH) * 100,
    100
  );

  // Calculate time-based efficiency score
  const expectedTime = {
    [DrillType.CasePrompt]: 300000, // 5 minutes
    [DrillType.Calculations]: 180000, // 3 minutes
    [DrillType.MarketSizing]: 240000, // 4 minutes
    [DrillType.Brainstorming]: 180000 // 3 minutes
  }[drillType] || 240000;

  const speed = Math.min(
    ((expectedTime - (Date.now() - timeSpent)) / expectedTime) * 100,
    100
  );

  // Calculate drill-specific accuracy
  const accuracyMetrics = {
    [DrillType.Calculations]: calculateCalculationAccuracy(response),
    [DrillType.MarketSizing]: calculateMarketSizingAccuracy(response),
    [DrillType.CasePrompt]: calculateCasePromptAccuracy(response),
    [DrillType.Brainstorming]: calculateBrainstormingAccuracy(response)
  }[drillType] || 75;

  return {
    timeSpent: Date.now() - timeSpent,
    completeness,
    accuracy: accuracyMetrics,
    speed
  };
}

/**
 * Validates the structure and content of an AI evaluation result
 * @requirement System Performance - Ensuring reliable evaluation results
 */
function validateEvaluation(
  evaluation: any,
  criteria: DrillEvaluationCriteria
): boolean {
  try {
    // Validate basic structure
    if (!evaluation || typeof evaluation !== 'object') {
      return false;
    }

    // Validate score ranges
    if (
      typeof evaluation.score !== 'number' ||
      evaluation.score < 0 ||
      evaluation.score > 100
    ) {
      return false;
    }

    // Validate feedback completeness
    if (
      !Array.isArray(evaluation.strengths) ||
      !Array.isArray(evaluation.improvements) ||
      !evaluation.feedback
    ) {
      return false;
    }

    // Validate criteria coverage
    const hasCriteria = criteria.rubric.criteria.every(criterion =>
      evaluation.feedback.some((item: string) => 
        item.toLowerCase().includes(criterion.toLowerCase())
      )
    );

    return hasCriteria;
  } catch (error) {
    return false;
  }
}

// Helper functions for accuracy calculations
function calculateCalculationAccuracy(response: string): number {
  // Implementation based on numerical precision and methodology
  const hasNumericalResults = /\d+\.?\d*/.test(response);
  const hasCalculationSteps = response.split('\n').length > 3;
  return hasNumericalResults && hasCalculationSteps ? 85 : 60;
}

function calculateMarketSizingAccuracy(response: string): number {
  // Implementation based on assumptions and logical flow
  const hasAssumptions = response.toLowerCase().includes('assume');
  const hasCalculation = /\d+\.?\d*/.test(response);
  return hasAssumptions && hasCalculation ? 90 : 70;
}

function calculateCasePromptAccuracy(response: string): number {
  // Implementation based on structure and framework usage
  const hasFramework = /(framework|structure|approach)/.test(response.toLowerCase());
  const hasConclusion = response.toLowerCase().includes('conclusion');
  return hasFramework && hasConclusion ? 95 : 75;
}

function calculateBrainstormingAccuracy(response: string): number {
  // Implementation based on idea quantity and uniqueness
  const ideas = response.split(/[.,\n]/).filter(Boolean);
  return Math.min(ideas.length * 10, 100);
}
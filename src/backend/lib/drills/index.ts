// @ts-check
import { z } from 'zod'; // ^3.22.0

import {
  DrillType,
  DrillResponse,
  DrillEvaluation,
  DrillEvaluationCriteria,
  DrillResult,
  DrillMetrics,
  EVALUATION_CRITERIA_SCHEMA
} from './types';

import {
  CalculationEvaluator,
  validateCalculation,
  calculateMetrics
} from './calculator';

import {
  evaluateDrillAttempt,
  calculateDrillMetrics
} from './evaluator';

// Human Tasks:
// 1. Monitor evaluation performance to ensure <200ms response time
// 2. Set up error tracking for failed evaluations
// 3. Configure alerts for timeout occurrences
// 4. Review and adjust timeout values based on performance metrics

/**
 * @fileoverview Main entry point for drill evaluation system
 * Requirements addressed:
 * - Practice Drills (3. SCOPE/Core Features/Practice Drills)
 * - AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 */

// Global configuration for evaluation timeouts and retries
const DEFAULT_EVALUATION_CONFIG = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  maxResponseLength: 8000
};

/**
 * Factory class for creating appropriate drill evaluators
 * Requirement: Practice Drills - Unified interface for different drill types
 */
export class DrillEvaluatorFactory {
  private static instance: DrillEvaluatorFactory;
  private evaluators: Map<DrillType, Function>;

  private constructor() {
    this.evaluators = new Map();
    
    // Register specific evaluators
    const calculationEvaluator = new CalculationEvaluator();
    this.evaluators.set(DrillType.CALCULATION, calculationEvaluator.evaluate.bind(calculationEvaluator));
    this.evaluators.set(DrillType.CASE_MATH, calculationEvaluator.evaluate.bind(calculationEvaluator));
    
    // Set default evaluator for other types
    this.evaluators.set(DrillType.CASE_PROMPT, evaluateDrillAttempt);
    this.evaluators.set(DrillType.MARKET_SIZING, evaluateDrillAttempt);
    this.evaluators.set(DrillType.BRAINSTORMING, evaluateDrillAttempt);
    this.evaluators.set(DrillType.SYNTHESIZING, evaluateDrillAttempt);
  }

  public static getInstance(): DrillEvaluatorFactory {
    if (!DrillEvaluatorFactory.instance) {
      DrillEvaluatorFactory.instance = new DrillEvaluatorFactory();
    }
    return DrillEvaluatorFactory.instance;
  }

  /**
   * Returns appropriate evaluator for drill type
   * Requirement: Practice Drills - Type-specific evaluation
   */
  public getEvaluator(drillType: DrillType): Function {
    const evaluator = this.evaluators.get(drillType);
    if (!evaluator) {
      return evaluateDrillAttempt; // Default evaluator
    }
    return evaluator;
  }
}

/**
 * Main function to evaluate any type of drill attempt
 * Requirements:
 * - AI Evaluation - Comprehensive evaluation system
 * - System Performance - <200ms response time
 */
export async function evaluateDrill(
  drillType: DrillType,
  prompt: string,
  response: string,
  criteria: DrillEvaluationCriteria
): Promise<DrillResult> {
  // Validate input parameters
  try {
    EVALUATION_CRITERIA_SCHEMA.parse(criteria);
  } catch (error) {
    throw new Error(`Invalid evaluation criteria: ${error.message}`);
  }

  // Validate response length
  if (response.length > DEFAULT_EVALUATION_CONFIG.maxResponseLength) {
    throw new Error(`Response exceeds maximum length of ${DEFAULT_EVALUATION_CONFIG.maxResponseLength} characters`);
  }

  // Get appropriate evaluator
  const evaluator = DrillEvaluatorFactory.getInstance().getEvaluator(drillType);
  
  // Execute evaluation with timeout and retries
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < DEFAULT_EVALUATION_CONFIG.maxRetries) {
    try {
      const evaluationPromise = evaluator(drillType, prompt, response, criteria);
      const result = await Promise.race([
        evaluationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Evaluation timeout')), DEFAULT_EVALUATION_CONFIG.timeout)
        )
      ]);

      // Calculate metrics
      const metrics = await getDrillMetrics(drillType, response, Date.now());

      return {
        evaluation: result,
        metrics,
        feedback: {
          strengths: result.strengths || [],
          improvements: result.improvements || [],
          detailedFeedback: result.feedback || {}
        }
      };
    } catch (error) {
      lastError = error;
      attempt++;
      // Wait before retry using exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw new Error(`Evaluation failed after ${attempt} attempts: ${lastError?.message}`);
}

/**
 * Retrieves performance metrics for any drill type
 * Requirement: Practice Drills - Performance measurement
 */
export function getDrillMetrics(
  drillType: DrillType,
  response: string,
  timeSpent: number
): DrillMetrics {
  // Calculate base metrics
  const baseMetrics = calculateDrillMetrics(response, timeSpent, drillType);

  // Apply drill-specific calculations
  if (drillType === DrillType.CALCULATION || drillType === DrillType.CASE_MATH) {
    const calculationMetrics = calculateMetrics(timeSpent, baseMetrics.accuracy, {
      targetTime: DEFAULT_EVALUATION_CONFIG.timeout / 2,
      targetAccuracy: 90
    });

    return {
      timeSpent: timeSpent,
      completeness: baseMetrics.completeness,
      accuracy: calculationMetrics.accuracyScore,
      speed: calculationMetrics.speedScore
    };
  }

  return baseMetrics;
}
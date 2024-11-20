// @ts-check
import { z } from 'zod'; // ^3.22.0
import { DrillType, DrillResponse, DrillEvaluation } from '../../types/drills';
import { validateDrillAttempt } from '../../utils/validation';

// Human Tasks:
// 1. Monitor calculation performance metrics to ensure <200ms response time
// 2. Configure logging for calculation accuracy tracking
// 3. Review and adjust CALCULATION_TOLERANCE based on user feedback
// 4. Set up alerts for calculation timeouts exceeding MAX_CALCULATION_TIME

/**
 * @fileoverview Calculation and case math drill evaluation implementation
 * Requirements addressed:
 * - Calculations Drills (3. SCOPE/Core Features/Practice Drills)
 * - Case Math Drills (3. SCOPE/Core Features/Practice Drills)
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 */

// Global constants for calculation configuration
const CALCULATION_TOLERANCE = 0.01;
const MAX_CALCULATION_TIME = 300000; // 5 minutes in milliseconds

// Zod schema for calculation validation
const calculationSchema = z.object({
  input: z.string().min(1),
  maxDigits: z.number().optional(),
  decimalPlaces: z.number().optional(),
  allowedOperators: z.array(z.enum(['+', '-', '*', '/', '%'])).optional()
});

/**
 * Validates numerical input and calculation format
 * Requirement: Calculations Drills - Input validation
 */
export function validateCalculation(input: string, constraints: {
  maxDigits?: number;
  decimalPlaces?: number;
  allowedOperators?: string[];
}): boolean {
  try {
    // Validate input format
    const result = calculationSchema.parse({ input, ...constraints });
    
    // Check for valid numerical expression
    const numericRegex = /^[\d\s+\-*/%.()\s]*$/;
    if (!numericRegex.test(result.input)) {
      return false;
    }

    // Validate max digits if specified
    if (constraints.maxDigits) {
      const digits = result.input.replace(/[^\d]/g, '');
      if (digits.length > constraints.maxDigits) {
        return false;
      }
    }

    // Validate decimal places if specified
    if (constraints.decimalPlaces !== undefined) {
      const decimals = result.input.split('.')[1];
      if (decimals && decimals.length > constraints.decimalPlaces) {
        return false;
      }
    }

    // Validate operators if specified
    if (constraints.allowedOperators) {
      const operators = result.input.match(/[+\-*/%]/g) || [];
      return operators.every(op => constraints.allowedOperators!.includes(op));
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Evaluates calculation accuracy with tolerance
 * Requirement: Case Math Drills - Accuracy evaluation
 */
export function evaluateCalculation(
  userAnswer: string,
  correctAnswer: number,
  evaluationCriteria: {
    tolerance?: number;
    requireExactMatch?: boolean;
  }
): DrillEvaluation {
  const tolerance = evaluationCriteria.tolerance || CALCULATION_TOLERANCE;
  const userNumeric = parseFloat(userAnswer);
  
  if (isNaN(userNumeric)) {
    return {
      attemptId: '', // Will be set by the caller
      score: 0,
      feedback: 'Invalid numerical input',
      strengths: [],
      improvements: ['Ensure your answer is a valid number'],
      evaluatedAt: new Date()
    };
  }

  const difference = Math.abs(userNumeric - correctAnswer);
  const percentageError = (difference / Math.abs(correctAnswer)) * 100;
  
  // Calculate score based on accuracy
  let score = 100;
  if (evaluationCriteria.requireExactMatch) {
    score = difference === 0 ? 100 : 0;
  } else {
    score = Math.max(0, 100 - (percentageError / tolerance));
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (score >= 95) {
    strengths.push('Excellent accuracy in calculation');
  } else if (score >= 80) {
    strengths.push('Good approximation within acceptable range');
    improvements.push('Minor refinement needed for perfect accuracy');
  } else {
    improvements.push('Review calculation methodology for better accuracy');
    improvements.push(`Expected ${correctAnswer}, received ${userNumeric}`);
  }

  return {
    attemptId: '', // Will be set by the caller
    score: Math.round(score),
    feedback: `Calculation evaluated with ${tolerance * 100}% tolerance`,
    strengths,
    improvements,
    evaluatedAt: new Date()
  };
}

/**
 * Calculates performance metrics for drill attempts
 * Requirement: System Performance - Response time tracking
 */
export function calculateMetrics(
  timeSpent: number,
  accuracy: number,
  benchmarks: {
    targetTime: number;
    targetAccuracy: number;
  }
): {
  speedScore: number;
  accuracyScore: number;
  efficiency: number;
  performance: string;
} {
  // Calculate speed score (inverse relationship with time)
  const speedScore = Math.max(0, 100 * (1 - timeSpent / MAX_CALCULATION_TIME));
  
  // Calculate accuracy score
  const accuracyScore = accuracy;
  
  // Calculate overall efficiency
  const efficiency = (speedScore + accuracyScore) / 2;
  
  // Determine performance rating
  let performance: string;
  if (efficiency >= 90) {
    performance = 'Excellent';
  } else if (efficiency >= 75) {
    performance = 'Good';
  } else if (efficiency >= 60) {
    performance = 'Satisfactory';
  } else {
    performance = 'Needs Improvement';
  }

  return {
    speedScore: Math.round(speedScore),
    accuracyScore: Math.round(accuracyScore),
    efficiency: Math.round(efficiency),
    performance
  };
}

/**
 * Handles evaluation of calculation and case math drill responses
 * Requirements: Calculations Drills, Case Math Drills
 */
export class CalculationEvaluator {
  private tolerance: number;
  private benchmarks: {
    targetTime: number;
    targetAccuracy: number;
  };

  constructor(config: {
    tolerance?: number;
    benchmarks?: {
      targetTime: number;
      targetAccuracy: number;
    }
  } = {}) {
    this.tolerance = config.tolerance || CALCULATION_TOLERANCE;
    this.benchmarks = config.benchmarks || {
      targetTime: MAX_CALCULATION_TIME / 2,
      targetAccuracy: 90
    };
  }

  /**
   * Evaluates a calculation drill attempt
   * Requirements: Calculations Drills, System Performance
   */
  async evaluate(drillAttempt: {
    id: string;
    response: string;
    correctAnswer: number;
    timeSpent: number;
    type: DrillType;
  }): Promise<DrillEvaluation> {
    // Validate attempt
    await validateDrillAttempt({
      ...drillAttempt,
      startedAt: new Date(Date.now() - drillAttempt.timeSpent)
    });

    // Evaluate calculation
    const evaluation = evaluateCalculation(
      drillAttempt.response,
      drillAttempt.correctAnswer,
      { tolerance: this.tolerance }
    );

    // Calculate performance metrics
    const metrics = calculateMetrics(
      drillAttempt.timeSpent,
      evaluation.score,
      this.benchmarks
    );

    // Generate detailed feedback
    const feedback = this.generateFeedback({
      evaluation,
      metrics,
      drillType: drillAttempt.type
    });

    return {
      ...evaluation,
      attemptId: drillAttempt.id,
      feedback: feedback.summary,
      strengths: [...evaluation.strengths, ...feedback.strengths],
      improvements: [...evaluation.improvements, ...feedback.improvements]
    };
  }

  /**
   * Generates detailed feedback for calculation response
   * Requirement: Case Math Drills - Detailed feedback
   */
  generateFeedback(params: {
    evaluation: DrillEvaluation;
    metrics: {
      speedScore: number;
      accuracyScore: number;
      efficiency: number;
      performance: string;
    };
    drillType: DrillType;
  }): {
    summary: string;
    strengths: string[];
    improvements: string[];
  } {
    const { evaluation, metrics, drillType } = params;
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyze speed performance
    if (metrics.speedScore >= 90) {
      strengths.push('Excellent calculation speed');
    } else if (metrics.speedScore < 60) {
      improvements.push('Work on improving calculation speed');
    }

    // Analyze accuracy and efficiency
    if (metrics.efficiency >= 85) {
      strengths.push('Strong balance of speed and accuracy');
    } else if (metrics.accuracyScore < metrics.speedScore) {
      improvements.push('Focus on accuracy over speed');
    } else {
      improvements.push('Practice mental math techniques for faster calculations');
    }

    // Type-specific feedback
    if (drillType === DrillType.CASE_MATH) {
      strengths.push('Applied case math principles effectively');
    }

    const summary = `${metrics.performance} performance with ${metrics.accuracyScore}% accuracy and ${metrics.speedScore}% speed efficiency.`;

    return {
      summary,
      strengths,
      improvements
    };
  }
}
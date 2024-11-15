// @jest/globals ^29.0.0
// jest-mock ^29.0.0

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { MockInstance } from 'jest-mock';
import {
  DrillType,
  DrillResponse,
  DrillEvaluation,
  DrillEvaluationCriteria,
  DrillResult,
  DrillMetrics
} from '../../lib/drills/types';
import {
  CalculationEvaluator,
  validateCalculation,
  calculateMetrics
} from '../../lib/drills/calculator';
import {
  evaluateDrillAttempt,
  calculateDrillMetrics
} from '../../lib/drills/evaluator';

// Human Tasks:
// 1. Configure monitoring for test execution times to ensure <200ms response time
// 2. Set up alerting for test failures in CI/CD pipeline
// 3. Review and update test data sets periodically
// 4. Validate test coverage meets minimum threshold

// Mock data for tests
const mockEvaluationResponse: DrillEvaluation = {
  attemptId: 'test-123',
  score: 85,
  feedback: 'Good analysis with room for improvement',
  strengths: ['Clear structure', 'Logical flow'],
  improvements: ['Add more quantitative support'],
  evaluatedAt: new Date()
};

const testDrillAttempt: DrillResponse = {
  id: 'test-123',
  userId: 'user-123',
  drillType: DrillType.CasePrompt,
  prompt: 'Market entry strategy for retail company',
  response: 'The market entry strategy should consider...',
  startedAt: new Date(Date.now() - 300000), // 5 minutes ago
  submittedAt: new Date()
};

describe('DrillEvaluator', () => {
  // Mock OpenAI evaluation
  let evaluateDrillResponseMock: MockInstance;
  
  beforeEach(() => {
    // Setup mocks
    evaluateDrillResponseMock = jest.fn().mockResolvedValue(mockEvaluationResponse);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('evaluateDrillAttempt returns valid evaluation result', async () => {
    // Requirement: AI Evaluation - Verify evaluation accuracy
    const criteria: DrillEvaluationCriteria = {
      drillType: DrillType.CasePrompt,
      rubric: {
        criteria: ['Structure', 'Analysis', 'Conclusion'],
        scoringGuide: {
          Structure: 'Clear MECE framework',
          Analysis: 'Data-driven insights',
          Conclusion: 'Actionable recommendations'
        },
        maxScore: 100
      },
      weights: {
        Structure: 0.3,
        Analysis: 0.4,
        Conclusion: 0.3
      }
    };

    const result = await evaluateDrillAttempt(
      testDrillAttempt.drillType,
      testDrillAttempt.prompt,
      testDrillAttempt.response,
      criteria
    );

    // Verify result structure and content
    expect(result).toBeDefined();
    expect(result.evaluation.score).toBeGreaterThanOrEqual(0);
    expect(result.evaluation.score).toBeLessThanOrEqual(100);
    expect(result.metrics).toBeDefined();
    expect(result.feedback).toBeDefined();

    // Verify performance requirements
    // Requirement: System Performance - Response time <200ms
    expect(Date.now() - result.evaluation.evaluatedAt.getTime()).toBeLessThan(200);
  });

  test('calculateDrillMetrics computes accurate metrics', () => {
    // Requirement: Practice Drills - Performance metrics calculation
    const metrics = calculateDrillMetrics(
      testDrillAttempt.response,
      300000, // 5 minutes
      DrillType.CasePrompt
    );

    expect(metrics).toMatchObject({
      timeSpent: expect.any(Number),
      completeness: expect.any(Number),
      accuracy: expect.any(Number),
      speed: expect.any(Number)
    });

    // Verify metric ranges
    expect(metrics.completeness).toBeGreaterThanOrEqual(0);
    expect(metrics.completeness).toBeLessThanOrEqual(100);
    expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(metrics.accuracy).toBeLessThanOrEqual(100);
    expect(metrics.speed).toBeGreaterThanOrEqual(0);
    expect(metrics.speed).toBeLessThanOrEqual(100);
  });
});

describe('CalculationEvaluator', () => {
  let calculator: CalculationEvaluator;

  beforeEach(() => {
    calculator = new CalculationEvaluator({
      tolerance: 0.01,
      benchmarks: {
        targetTime: 180000, // 3 minutes
        targetAccuracy: 90
      }
    });
  });

  test('validateCalculation handles various input formats', () => {
    // Requirement: Calculations Drills - Input validation
    expect(validateCalculation('1234', { maxDigits: 4 })).toBeTruthy();
    expect(validateCalculation('12.34', { decimalPlaces: 2 })).toBeTruthy();
    expect(validateCalculation('1+2*3', { allowedOperators: ['+', '*'] })).toBeTruthy();
    
    // Invalid cases
    expect(validateCalculation('abc', { maxDigits: 4 })).toBeFalsy();
    expect(validateCalculation('12.345', { decimalPlaces: 2 })).toBeFalsy();
    expect(validateCalculation('1/2', { allowedOperators: ['+', '*'] })).toBeFalsy();
  });

  test('calculateMetrics provides accurate performance metrics', () => {
    // Requirement: System Performance - Metrics computation
    const metrics = calculateMetrics(120000, 85, {
      targetTime: 180000,
      targetAccuracy: 90
    });

    expect(metrics).toMatchObject({
      speedScore: expect.any(Number),
      accuracyScore: expect.any(Number),
      efficiency: expect.any(Number),
      performance: expect.any(String)
    });

    // Verify metric calculations
    expect(metrics.speedScore).toBeGreaterThanOrEqual(0);
    expect(metrics.speedScore).toBeLessThanOrEqual(100);
    expect(metrics.accuracyScore).toBe(85);
    expect(metrics.efficiency).toBeGreaterThanOrEqual(0);
    expect(metrics.efficiency).toBeLessThanOrEqual(100);
  });

  test('evaluate handles calculation drill attempts', async () => {
    // Requirement: Case Math Drills - Evaluation accuracy
    const attempt = {
      id: 'calc-123',
      response: '1234.56',
      correctAnswer: 1234.567,
      timeSpent: 60000, // 1 minute
      type: DrillType.Calculations
    };

    const result = await calculator.evaluate(attempt);

    // Verify evaluation result
    expect(result.attemptId).toBe(attempt.id);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.feedback).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.improvements).toBeInstanceOf(Array);

    // Verify response time
    // Requirement: System Performance - Response time <200ms
    expect(Date.now() - result.evaluatedAt.getTime()).toBeLessThan(200);
  });

  test('evaluate handles timeout scenarios', async () => {
    // Requirement: System Performance - Timeout handling
    const slowAttempt = {
      id: 'slow-123',
      response: '1234.56',
      correctAnswer: 1234.567,
      timeSpent: 600000, // 10 minutes (exceeds timeout)
      type: DrillType.Calculations
    };

    await expect(calculator.evaluate(slowAttempt)).rejects.toThrow('Evaluation timeout');
  });
});
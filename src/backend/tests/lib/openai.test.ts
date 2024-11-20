// Human Tasks:
// 1. Monitor test execution times to ensure performance targets are met
// 2. Verify OpenAI API key is properly configured in test environment
// 3. Review and update test data for different drill types
// 4. Adjust timeout values based on observed API response patterns

import { describe, expect, jest, beforeEach, afterEach, test } from '@jest/globals'; // ^29.0.0
import { OpenAI } from 'openai'; // ^4.0.0
import { OpenAIService, evaluateDrillResponse, generateFeedback } from '../../lib/openai';
import { DRILL_PROMPTS } from '../../lib/openai/prompts';
import { openaiConfig } from '../../config/openai';
import { DrillType } from '../../types/drills';

// Mock OpenAI client
jest.mock('openai');

// Test data
const mockDrillResponse = 'Sample drill response text for testing';
const mockEvaluationCriteria = {
  drillType: DrillType.CASE_PROMPT,
  rubric: { clarity: 0.3, structure: 0.3, analysis: 0.4 },
  weights: { clarity: 30, structure: 30, analysis: 40 }
};

describe('OpenAIService Integration Tests', () => {
  let openaiService: OpenAIService;
  let mockOpenAIResponse: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup OpenAI mock response
    mockOpenAIResponse = jest.fn();
    (OpenAI as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAIResponse
        }
      }
    }));

    // Initialize service with test config
    openaiService = new OpenAIService(openaiConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // @requirement: AI Evaluation - Verify AI evaluation functionality for providing consistent, objective feedback
  test('evaluateDrillResponse should process different drill types correctly', async () => {
    // Mock successful API response
    mockOpenAIResponse.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            scores: [8, 7, 9],
            weightedTotal: 85,
            justification: 'Strong analysis with clear structure',
            improvements: ['Consider deeper market analysis', 'Add more quantitative support']
          })
        }
      }]
    });

    // Test case prompt evaluation
    const caseResult = await evaluateDrillResponse(
      DrillType.CASE_PROMPT,
      mockDrillResponse,
      mockEvaluationCriteria
    );

    expect(caseResult).toMatchObject({
      score: 85,
      feedback: expect.any(String),
      strengths: expect.any(Array),
      improvements: expect.any(Array),
      evaluatedAt: expect.any(Date)
    });

    // Test market sizing evaluation
    const marketResult = await evaluateDrillResponse(
      DrillType.MARKET_SIZING,
      mockDrillResponse,
      mockEvaluationCriteria
    );

    expect(marketResult.score).toBeDefined();
    expect(marketResult.feedback).toBeDefined();
    expect(marketResult.strengths.length).toBeGreaterThan(0);
    expect(marketResult.improvements.length).toBeGreaterThan(0);
  });

  // @requirement: AI Evaluation - Verify AI evaluation functionality for providing consistent, objective feedback
  test('generateFeedback should provide detailed, structured feedback', async () => {
    const mockEvaluation = {
      attemptId: '123',
      score: 85,
      feedback: 'Initial feedback',
      strengths: ['Clear structure', 'Strong analysis'],
      improvements: ['Add quantitative support'],
      evaluatedAt: new Date()
    };

    mockOpenAIResponse.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            feedback: 'Detailed feedback with specific recommendations',
            scores: { clarity: 8, structure: 9, analysis: 8 },
            weightedTotal: 85,
            justification: 'Strong overall performance',
            improvements: ['Specific improvement point 1', 'Specific improvement point 2']
          })
        }
      }]
    });

    const feedback = await generateFeedback(mockEvaluation);

    expect(feedback).toBeDefined();
    expect(typeof feedback).toBe('string');
    expect(feedback.length).toBeGreaterThan(0);
  });

  // @requirement: System Performance - Validate API response times meet <200ms target for 95% of requests
  test('API response times should meet performance requirements', async () => {
    const startTime = Date.now();
    
    mockOpenAIResponse.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            scores: [8, 7, 9],
            weightedTotal: 85,
            justification: 'Test feedback',
            improvements: ['Test improvement']
          })
        }
      }]
    });

    await openaiService.sendRequest(DRILL_PROMPTS.CASE_PROMPT);
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(200);
  });

  test('error handling should handle API failures appropriately', async () => {
    // Mock API failure
    mockOpenAIResponse.mockRejectedValue(new Error('API Error'));

    // Test retry behavior
    await expect(openaiService.sendRequest(DRILL_PROMPTS.CALCULATIONS))
      .rejects
      .toThrow('API Error');

    // Verify retry attempts
    expect(mockOpenAIResponse).toHaveBeenCalledTimes(4); // Initial + 3 retries

    // Test timeout handling
    mockOpenAIResponse.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 11000)));
    
    await expect(openaiService.sendRequest(DRILL_PROMPTS.MARKET_SIZING))
      .rejects
      .toThrow('Request timeout');
  });

  test('should validate response format correctly', async () => {
    // Test invalid response format
    mockOpenAIResponse.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            invalidField: 'test'
          })
        }
      }]
    });

    await expect(openaiService.sendRequest(DRILL_PROMPTS.CASE_PROMPT))
      .rejects
      .toThrow('Invalid API response format');

    // Test valid response format
    mockOpenAIResponse.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            scores: [8, 7, 9],
            weightedTotal: 85,
            justification: 'Valid feedback',
            improvements: ['Valid improvement']
          })
        }
      }]
    });

    const response = await openaiService.sendRequest(DRILL_PROMPTS.CASE_PROMPT);
    expect(response).toHaveProperty('scores');
    expect(response).toHaveProperty('weightedTotal');
    expect(response).toHaveProperty('justification');
    expect(response).toHaveProperty('improvements');
  });
});
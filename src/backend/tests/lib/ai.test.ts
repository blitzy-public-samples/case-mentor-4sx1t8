/**
 * Test suite for AI-related functionality
 * 
 * Human Tasks Required:
 * 1. Configure test environment variables for OpenAI API key
 * 2. Review and update mock responses if evaluation criteria change
 * 3. Verify test coverage meets requirements
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals'; // ^29.0.0
import { OpenAI } from 'openai'; // ^4.0.0
import { DrillEvaluator } from '../../lib/ai/evaluator';
import { FeedbackGenerator } from '../../lib/ai/feedback-generator';
import { getPromptTemplate, generatePrompt } from '../../lib/ai/prompt-templates';

// Mock OpenAI client
jest.mock('openai');

// Mock successful API response
const mockCompletionResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        overallScore: 85,
        criteriaScores: {
          'Problem Structuring': 90,
          'Analysis Quality': 85,
          'Communication': 80,
          'Recommendations': 85
        },
        feedback: 'Strong overall response with clear structure',
        improvementAreas: ['Consider additional quantitative analysis'],
        strengths: ['Excellent problem structuring', 'Clear communication']
      })
    }
  }]
};

describe('DrillEvaluator', () => {
  let openaiClient: jest.Mocked<OpenAI>;
  let evaluator: DrillEvaluator;

  beforeEach(() => {
    // Reset mocks before each test
    openaiClient = new OpenAI() as jest.Mocked<OpenAI>;
    openaiClient.chat = {
      completions: {
        create: jest.fn().mockResolvedValue(mockCompletionResponse)
      }
    } as any;
    evaluator = new DrillEvaluator(openaiClient);
  });

  /**
   * Requirement: AI evaluation - Response time target
   * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
   */
  test('evaluates responses within 200ms time limit', async () => {
    const startTime = Date.now();
    
    await evaluator.evaluateResponse({
      type: 'CASE_PROMPT',
      description: 'Test case prompt',
      evaluationCriteria: [
        { category: 'Problem Structuring', weight: 30 },
        { category: 'Analysis Quality', weight: 30 },
        { category: 'Communication', weight: 20 },
        { category: 'Recommendations', weight: 20 }
      ]
    }, {
      id: 'test-1',
      response: 'Test response'
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(200);
  });

  /**
   * Requirement: Practice Drills - Case prompt evaluation
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  test('successfully evaluates case prompt responses', async () => {
    const result = await evaluator.evaluateResponse({
      type: 'CASE_PROMPT',
      description: 'Market entry strategy case',
      evaluationCriteria: [
        { category: 'Problem Structuring', weight: 30 },
        { category: 'Analysis Quality', weight: 30 },
        { category: 'Communication', weight: 20 },
        { category: 'Recommendations', weight: 20 }
      ]
    }, {
      id: 'case-1',
      response: 'Structured response with framework...'
    });

    expect(result.overallScore).toBeDefined();
    expect(result.criteriaScores).toBeDefined();
    expect(result.feedback).toBeDefined();
    expect(result.improvementAreas).toBeInstanceOf(Array);
    expect(result.strengths).toBeInstanceOf(Array);
  });

  /**
   * Requirement: Practice Drills - Market sizing evaluation
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  test('evaluates market sizing responses', async () => {
    const result = await evaluator.evaluateResponse({
      type: 'MARKET_SIZING',
      description: 'Coffee market size in NYC',
      evaluationCriteria: [
        { category: 'Methodology', weight: 40 },
        { category: 'Calculations', weight: 30 },
        { category: 'Logic', weight: 30 }
      ]
    }, {
      id: 'market-1',
      response: 'Population-based calculation approach...'
    });

    expect(result.overallScore).toBeGreaterThan(0);
    expect(Object.keys(result.criteriaScores)).toHaveLength(3);
  });

  test('handles API errors with retry mechanism', async () => {
    openaiClient.chat.completions.create
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockCompletionResponse);

    const result = await evaluator.evaluateResponse({
      type: 'CASE_PROMPT',
      description: 'Test prompt',
      evaluationCriteria: [{ category: 'Test', weight: 100 }]
    }, {
      id: 'test-1',
      response: 'Test response'
    });

    expect(result).toBeDefined();
    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(2);
  });
});

describe('FeedbackGenerator', () => {
  let openaiClient: jest.Mocked<OpenAI>;
  let evaluator: DrillEvaluator;
  let feedbackGenerator: FeedbackGenerator;

  beforeEach(() => {
    openaiClient = new OpenAI() as jest.Mocked<OpenAI>;
    openaiClient.chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                overall: 'Strong performance overall',
                criteria: {
                  'Problem Structuring': 'Well-structured approach',
                  'Analysis': 'Good analytical depth'
                },
                improvements: ['Consider quantitative analysis'],
                strengths: ['Clear communication']
              })
            }
          }]
        })
      }
    } as any;
    evaluator = new DrillEvaluator(openaiClient);
    feedbackGenerator = new FeedbackGenerator(openaiClient, evaluator);
  });

  /**
   * Requirement: Practice Drills - Comprehensive feedback
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  test('generates detailed feedback for all drill types', async () => {
    const drillTypes = ['CASE_PROMPT', 'MARKET_SIZING', 'CALCULATIONS', 'BRAINSTORMING', 'SYNTHESIZING'];
    
    for (const drillType of drillTypes) {
      const feedback = await feedbackGenerator.generateFeedback({
        id: 'test-1',
        response: 'Test response'
      }, {
        drillType,
        criteriaScores: { 'Overall': 85 },
        evaluationResult: { score: 85, feedback: 'Good work' }
      });

      expect(feedback.attemptId).toBe('test-1');
      expect(feedback.overallFeedback).toBeDefined();
      expect(feedback.criteriaFeedback).toBeDefined();
      expect(feedback.improvementAreas).toBeInstanceOf(Array);
      expect(feedback.strengths).toBeInstanceOf(Array);
    }
  });

  test('handles feedback generation errors gracefully', async () => {
    openaiClient.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(feedbackGenerator.generateFeedback({
      id: 'test-1',
      response: 'Test response'
    }, {
      drillType: 'CASE_PROMPT',
      criteriaScores: {},
      evaluationResult: {}
    })).rejects.toThrow('Failed to generate feedback');
  });
});

describe('PromptTemplates', () => {
  /**
   * Requirement: AI evaluation - Template management
   * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
   */
  test('retrieves correct templates for all drill types', () => {
    const drillTypes = ['CASE_PROMPT', 'MARKET_SIZING', 'CALCULATIONS', 'BRAINSTORMING', 'SYNTHESIZING'];
    
    drillTypes.forEach(drillType => {
      const template = getPromptTemplate(drillType as any);
      expect(template.systemPrompt).toBeDefined();
      expect(template.userPromptTemplate).toBeDefined();
      expect(template.requiredVariables).toBeInstanceOf(Array);
      expect(template.examples).toBeDefined();
    });
  });

  test('generates complete prompts with variables', () => {
    const template = getPromptTemplate('CASE_PROMPT');
    const variables = {
      caseSituation: 'Test case',
      candidateResponse: 'Test response',
      evaluationCriteria: 'Test criteria'
    };

    const prompt = generatePrompt(template, variables);
    expect(prompt).toContain('Test case');
    expect(prompt).toContain('Test response');
    expect(prompt).toContain('Test criteria');
  });

  test('throws error for missing required variables', () => {
    const template = getPromptTemplate('CASE_PROMPT');
    const variables = {
      caseSituation: 'Test case'
      // Missing required variables
    };

    expect(() => generatePrompt(template, variables)).toThrow('Missing required variables');
  });
});
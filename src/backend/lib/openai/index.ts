// Human Tasks:
// 1. Monitor OpenAI API usage and costs
// 2. Set up error alerting for failed API calls
// 3. Adjust retry parameters based on error patterns
// 4. Configure timeout values based on response time metrics

import { OpenAI } from 'openai'; // v4.0.0
import { openaiConfig } from '../../config/openai';
import { DrillType } from '../../types/drills';
import { DRILL_PROMPTS } from './prompts';

// @requirement: System Performance - <200ms API response time for 95% of requests
const TIMEOUT_MS = 10000;
const RETRY_OPTIONS = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffFactor: 1.5
};

// Initialize OpenAI client with configuration
const openaiClient = new OpenAI({ apiKey: openaiConfig.apiKey });

/**
 * Decorator for implementing retry logic on API calls
 * @param options Retry configuration options
 */
function retryOnFailure(options: typeof RETRY_OPTIONS) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      let delay = options.retryDelay;

      for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
        try {
          return await Promise.race([
            originalMethod.apply(this, args),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS)
            )
          ]);
        } catch (error) {
          lastError = error as Error;
          if (attempt < options.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= options.backoffFactor;
          }
        }
      }
      throw lastError;
    };
    return descriptor;
  };
}

/**
 * Validates OpenAI API response format and content structure
 * @param response API response object to validate
 * @returns boolean indicating if response is valid
 */
function validateResponse(response: object): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const requiredFields = ['scores', 'weightedTotal', 'justification', 'improvements'];
  return requiredFields.every(field => field in response);
}

/**
 * Service class for managing OpenAI interactions
 * @requirement: AI Evaluation - Core Services: AI evaluation for providing consistent, objective feedback
 */
export class OpenAIService {
  private client: OpenAI;
  private config: typeof openaiConfig;

  constructor(config = openaiConfig) {
    this.client = openaiClient;
    this.config = config;
  }

  /**
   * Sends a request to OpenAI API with error handling and retries
   * @param prompt Evaluation prompt
   * @param options Request configuration options
   * @returns Processed and validated API response
   */
  @retryOnFailure(RETRY_OPTIONS)
  async sendRequest(prompt: string, options: { temperature?: number; maxTokens?: number } = {}) {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'system', content: prompt }],
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (!validateResponse(result)) {
      throw new Error('Invalid API response format');
    }

    return result;
  }
}

/**
 * Evaluates a drill attempt using OpenAI's GPT model
 * @param drillType Type of drill being evaluated
 * @param response User's drill response
 * @param criteria Evaluation criteria for the drill
 * @returns Evaluation results including score and feedback
 */
@retryOnFailure(RETRY_OPTIONS)
export async function evaluateDrillResponse(
  drillType: DrillType,
  response: string,
  criteria: DrillEvaluationCriteria
): Promise<DrillEvaluation> {
  const service = new OpenAIService();
  const prompt = DRILL_PROMPTS[drillType];
  
  if (!prompt) {
    throw new Error(`Invalid drill type: ${drillType}`);
  }

  const result = await service.sendRequest(prompt, {
    temperature: 0.3, // Lower temperature for more consistent evaluation
    maxTokens: 1000
  });

  return {
    attemptId: crypto.randomUUID(),
    score: result.weightedTotal,
    feedback: result.justification,
    strengths: result.scores.filter((s: number) => s >= 8).map((s: number, i: number) => 
      `Strong performance in criterion ${i + 1}`
    ),
    improvements: result.improvements,
    evaluatedAt: new Date()
  };
}

/**
 * Generates detailed feedback for a drill evaluation
 * @param evaluation Drill evaluation results
 * @returns Detailed feedback with improvement suggestions
 */
@retryOnFailure(RETRY_OPTIONS)
export async function generateFeedback(evaluation: DrillEvaluation): Promise<string> {
  const service = new OpenAIService();
  
  const feedbackPrompt = `
    Based on the following evaluation:
    Score: ${evaluation.score}
    Strengths: ${evaluation.strengths.join(', ')}
    Areas for Improvement: ${evaluation.improvements.join(', ')}
    
    Generate detailed, actionable feedback with specific examples and recommendations.
  `;

  const result = await service.sendRequest(feedbackPrompt, {
    temperature: 0.7, // Higher temperature for more creative feedback
    maxTokens: 1500
  });

  return result.feedback;
}
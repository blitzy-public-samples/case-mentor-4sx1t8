// Human Tasks:
// 1. Configure cache storage backend (Redis recommended)
// 2. Set up monitoring for feedback generation latency
// 3. Configure alert thresholds for retry attempts
// 4. Verify cache eviction policies align with storage capacity

import { z } from 'zod'; // ^3.22.0
import { Feedback } from '../models/Feedback';
import { OpenAIService } from '../lib/openai';
import { APIError, APIErrorCode } from '../types/api';

/**
 * @fileoverview Service for managing AI-powered feedback operations
 * Requirements addressed:
 * - AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
 * - Progress Tracking (3. SCOPE/Core Features/User Management)
 */

// Validation schemas
const FeedbackRequestSchema = z.object({
  attemptId: z.string().uuid(),
  type: z.enum(['drill', 'simulation']),
  response: z.object({
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })
});

const FeedbackUpdateSchema = z.object({
  content: z.object({
    summary: z.string().optional(),
    strengths: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    detailedAnalysis: z.string().optional()
  }),
  score: z.number().min(0).max(100).optional(),
  metrics: z.array(z.object({
    name: z.string(),
    score: z.number(),
    feedback: z.string(),
    category: z.string()
  })).optional()
});

/**
 * Validates feedback request data against schema
 * @param requestData Request data to validate
 * @returns Boolean indicating validation result
 */
function validateFeedbackRequest(requestData: unknown): boolean {
  try {
    FeedbackRequestSchema.parse(requestData);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Service class for managing AI-powered feedback operations
 * @requirement AI Evaluation - Core Services
 */
export class FeedbackService {
  private openAIService: OpenAIService;
  private feedbackCache: Map<string, { data: any; timestamp: number }>;
  private readonly cacheTTL: number = FEEDBACK_CACHE_TTL;
  private readonly maxRetries: number = MAX_RETRIES;

  constructor(openAIService: OpenAIService) {
    this.openAIService = openAIService;
    this.feedbackCache = new Map();
  }

  /**
   * Generates AI feedback for a drill or simulation attempt
   * @requirement AI Evaluation - Consistent feedback generation
   */
  public async generateFeedback(
    attemptId: string,
    type: 'drill' | 'simulation',
    response: { content: string; metadata?: Record<string, any> }
  ): Promise<object> {
    if (!validateFeedbackRequest({ attemptId, type, response })) {
      throw {
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid feedback request data'
      } as APIError;
    }

    try {
      let retries = 0;
      let feedback;

      while (retries < this.maxRetries) {
        try {
          const evaluation = await this.openAIService.evaluateDrillResponse(
            type,
            response.content,
            response.metadata
          );

          const feedbackContent = await this.openAIService.generateFeedback(evaluation);

          feedback = new Feedback({
            attemptId,
            type,
            content: {
              summary: feedbackContent,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
              detailedAnalysis: evaluation.feedback
            },
            score: evaluation.score,
            metrics: evaluation.metrics
          });

          break;
        } catch (error) {
          retries++;
          if (retries === this.maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      await feedback.save();
      this.cacheFeedback(feedback.id, feedback);
      return feedback;

    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to generate feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Retrieves feedback by ID with caching
   * @requirement Progress Tracking - Performance analytics
   */
  public async getFeedback(feedbackId: string): Promise<object | null> {
    const cached = this.getCachedFeedback(feedbackId);
    if (cached) return cached;

    try {
      const feedback = await Feedback.findById(feedbackId);
      if (feedback) {
        this.cacheFeedback(feedbackId, feedback);
      }
      return feedback;
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to retrieve feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Retrieves all feedback for a specific attempt
   * @requirement Progress Tracking - Performance history
   */
  public async getAttemptFeedback(attemptId: string): Promise<object[]> {
    if (!z.string().uuid().safeParse(attemptId).success) {
      throw {
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid attempt ID format'
      } as APIError;
    }

    try {
      const feedback = await Feedback.findByAttempt(attemptId);
      return feedback;
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to retrieve attempt feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Updates existing feedback with cache invalidation
   * @requirement Progress Tracking - Feedback management
   */
  public async updateFeedback(feedbackId: string, updateData: object): Promise<void> {
    try {
      const validated = FeedbackUpdateSchema.parse(updateData);
      const feedback = await Feedback.findById(feedbackId);

      if (!feedback) {
        throw {
          code: APIErrorCode.NOT_FOUND,
          message: 'Feedback not found'
        } as APIError;
      }

      await feedback.update(validated);
      this.invalidateCache(feedbackId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw {
          code: APIErrorCode.VALIDATION_ERROR,
          message: 'Invalid update data',
          details: error
        } as APIError;
      }
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to update feedback',
        details: error
      } as APIError;
    }
  }

  private cacheFeedback(id: string, data: any): void {
    this.feedbackCache.set(id, {
      data,
      timestamp: Date.now()
    });
  }

  private getCachedFeedback(id: string): object | null {
    const cached = this.feedbackCache.get(id);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL * 1000) {
      this.feedbackCache.delete(id);
      return null;
    }

    return cached.data;
  }

  private invalidateCache(id: string): void {
    this.feedbackCache.delete(id);
  }
}
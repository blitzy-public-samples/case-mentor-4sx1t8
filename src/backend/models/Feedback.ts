// Human Tasks:
// 1. Configure AI evaluation metrics thresholds in environment variables
// 2. Set up monitoring for feedback generation performance
// 3. Verify database indexes for feedback queries are optimized
// 4. Configure backup retention policy for feedback data

import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { z } from 'zod'; // ^3.22.0
import { SupabaseClient } from '@supabase/supabase-js'; // ^2.38.0
import { APIError, APIErrorCode } from '../types/api';
import { executeQuery, withTransaction } from '../utils/database';

/**
 * @fileoverview Feedback model for AI-generated evaluations
 * Requirements addressed:
 * - AI Evaluation (3. SCOPE/Core Features/Practice Drills)
 * - Performance Analytics (2. SYSTEM OVERVIEW/High-Level Description/Core Services)
 */

// Validation schemas
const MetricSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  category: z.string()
});

const FeedbackContentSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  detailedAnalysis: z.string()
});

const FeedbackSchema = z.object({
  id: z.string().uuid().optional(),
  attemptId: z.string().uuid(),
  type: z.enum(['drill', 'simulation']),
  content: FeedbackContentSchema,
  score: z.number().min(0).max(100),
  metrics: z.array(MetricSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

type FeedbackData = z.infer<typeof FeedbackSchema>;
type FeedbackMetric = z.infer<typeof MetricSchema>;

export class Feedback {
  public id: string;
  public attemptId: string;
  public type: 'drill' | 'simulation';
  public content: {
    summary: string;
    strengths: string[];
    improvements: string[];
    detailedAnalysis: string;
  };
  public score: number;
  public metrics: FeedbackMetric[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(feedbackData: FeedbackData) {
    const validated = FeedbackSchema.parse(feedbackData);
    
    this.id = validated.id || uuidv4();
    this.attemptId = validated.attemptId;
    this.type = validated.type;
    this.content = validated.content;
    this.score = validated.score;
    this.metrics = validated.metrics;
    this.createdAt = validated.createdAt || new Date();
    this.updatedAt = validated.updatedAt || new Date();
  }

  /**
   * Persists feedback to database
   * @requirement AI Evaluation - Structured feedback storage
   */
  public async save(): Promise<void> {
    try {
      await withTransaction(async (client: SupabaseClient) => {
        await executeQuery(
          'INSERT INTO feedback (id, attempt_id, type, content, score, metrics, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [this.id, this.attemptId, this.type, this.content, this.score, this.metrics, this.createdAt, this.updatedAt]
        );

        await executeQuery(
          'UPDATE attempts SET feedback_id = $1 WHERE id = $2',
          [this.id, this.attemptId]
        );
      });
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to save feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Updates existing feedback
   * @requirement Performance Analytics - Feedback management
   */
  public async update(updateData: Partial<FeedbackData>): Promise<void> {
    try {
      const validated = FeedbackSchema.partial().parse(updateData);
      this.updatedAt = new Date();

      await withTransaction(async (client: SupabaseClient) => {
        const updates = {
          ...validated,
          updated_at: this.updatedAt
        };

        await executeQuery(
          'UPDATE feedback SET data = $1 WHERE id = $2',
          [updates, this.id]
        );

        if (validated.metrics) {
          await executeQuery(
            'UPDATE feedback_metrics SET data = $1 WHERE feedback_id = $2',
            [validated.metrics, this.id]
          );
        }
      });
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to update feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Deletes feedback entry
   * @requirement Performance Analytics - Data management
   */
  public async delete(): Promise<void> {
    try {
      await withTransaction(async (client: SupabaseClient) => {
        await executeQuery(
          'UPDATE attempts SET feedback_id = NULL WHERE feedback_id = $1',
          [this.id]
        );

        await executeQuery(
          'DELETE FROM feedback WHERE id = $1',
          [this.id]
        );
      });
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to delete feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Retrieves feedback by ID
   * @requirement Performance Analytics - Feedback retrieval
   */
  public static async findById(id: string): Promise<Feedback | null> {
    try {
      const result = await executeQuery<FeedbackData>(
        'SELECT * FROM feedback WHERE id = $1',
        [id],
        { singleRow: true }
      );

      return result ? new Feedback(result) : null;
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to retrieve feedback',
        details: error
      } as APIError;
    }
  }

  /**
   * Retrieves all feedback for an attempt
   * @requirement AI Evaluation - Feedback history
   */
  public static async findByAttempt(attemptId: string): Promise<Feedback[]> {
    try {
      const results = await executeQuery<FeedbackData[]>(
        'SELECT * FROM feedback WHERE attempt_id = $1 ORDER BY created_at DESC',
        [attemptId]
      );

      return results.map(result => new Feedback(result));
    } catch (error) {
      throw {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to retrieve attempt feedback',
        details: error
      } as APIError;
    }
  }
}
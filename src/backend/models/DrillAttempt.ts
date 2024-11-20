// Human Tasks:
// 1. Configure database connection environment variables
// 2. Set up monitoring for drill completion rates
// 3. Verify database indexes on drill_attempts table
// 4. Configure error tracking for failed evaluations

import { z } from 'zod'; // ^3.22.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { 
  DrillType, 
  DrillStatus, 
  DrillAttempt, 
  DrillEvaluation 
} from '../../types/drills';
import { 
  DrillResult, 
  DrillMetrics 
} from '../../lib/drills/types';
import { evaluateDrillAttempt } from '../../lib/drills/evaluator';

// Global constants
const DRILL_ATTEMPT_TABLE = 'drill_attempts';
const MAX_RESPONSE_LENGTH = 8000;

/**
 * Validates a drill attempt response against length and content requirements
 * @requirement Practice Drills - Ensure quality of drill responses
 */
function validateResponse(response: string): boolean {
  if (!response || typeof response !== 'string') {
    return false;
  }
  if (response.length > MAX_RESPONSE_LENGTH) {
    return false;
  }
  if (response.trim().length === 0) {
    return false;
  }
  return true;
}

/**
 * Model class for managing drill attempts with validation and evaluation
 * @requirement Practice Drills - Track and evaluate user practice attempts
 * @requirement User Engagement - Monitor completion rates
 */
export class DrillAttemptModel implements DrillAttempt {
  public id: string;
  public userId: string;
  public drillId: string;
  public status: DrillStatus;
  public response: string;
  public startedAt: Date;
  public completedAt: Date | null;
  public timeSpent: number;
  public evaluation: DrillEvaluation | null;

  private static readonly schema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    drillId: z.string().uuid(),
    status: z.nativeEnum(DrillStatus),
    response: z.string(),
    startedAt: z.date(),
    completedAt: z.date().nullable(),
    timeSpent: z.number().min(0),
    evaluation: z.object({
      attemptId: z.string().uuid(),
      score: z.number().min(0).max(100),
      feedback: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
      evaluatedAt: z.date()
    }).nullable()
  });

  private static readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  constructor(data: DrillAttempt) {
    // Validate input data
    DrillAttemptModel.schema.parse(data);

    this.id = data.id;
    this.userId = data.userId;
    this.drillId = data.drillId;
    this.status = data.status || DrillStatus.NOT_STARTED;
    this.response = data.response || '';
    this.startedAt = data.startedAt || new Date();
    this.completedAt = data.completedAt || null;
    this.timeSpent = data.timeSpent || 0;
    this.evaluation = null;
  }

  /**
   * Saves or updates the drill attempt in the database
   * @requirement Practice Drills - Persist user progress
   */
  async save(): Promise<DrillAttempt> {
    const { data, error } = await DrillAttemptModel.supabase
      .from(DRILL_ATTEMPT_TABLE)
      .upsert({
        id: this.id,
        user_id: this.userId,
        drill_id: this.drillId,
        status: this.status,
        response: this.response,
        started_at: this.startedAt.toISOString(),
        completed_at: this.completedAt?.toISOString() || null,
        time_spent: this.timeSpent,
        evaluation: this.evaluation
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save drill attempt: ${error.message}`);
    }

    return data as DrillAttempt;
  }

  /**
   * Marks a drill attempt as completed and triggers evaluation
   * @requirement Practice Drills - Automated evaluation system
   * @requirement User Engagement - Track completion status
   */
  async complete(response: string): Promise<DrillResult> {
    if (!validateResponse(response)) {
      throw new Error('Invalid response format or length');
    }

    this.response = response;
    this.status = DrillStatus.COMPLETED;
    this.completedAt = new Date();
    this.timeSpent = Math.floor(
      (this.completedAt.getTime() - this.startedAt.getTime()) / 1000
    );

    // Trigger AI evaluation
    const result = await evaluateDrillAttempt(
      DrillType.CASE_PROMPT, // TODO: Get actual drill type from drill record
      this.response,
      response,
      {
        drillType: DrillType.CASE_PROMPT,
        rubric: {
          criteria: ['structure', 'analysis', 'conclusion'],
          scoringGuide: {},
          maxScore: 100
        },
        weights: {
          structure: 0.3,
          analysis: 0.4,
          conclusion: 0.3
        }
      }
    );

    this.evaluation = result.evaluation;
    this.status = DrillStatus.EVALUATED;

    // Save updated attempt with evaluation
    await this.save();

    return result;
  }

  /**
   * Calculates performance metrics for the drill attempt
   * @requirement Practice Drills - Performance tracking
   */
  calculateMetrics(): DrillMetrics {
    const completeness = Math.min(
      (this.response.length / MAX_RESPONSE_LENGTH) * 100,
      100
    );

    const accuracy = this.evaluation?.score || 0;

    const expectedTime = 300; // 5 minutes in seconds
    const speed = Math.max(
      0,
      100 - ((this.timeSpent - expectedTime) / expectedTime) * 100
    );

    return {
      timeSpent: this.timeSpent,
      completeness,
      accuracy,
      speed
    };
  }
}
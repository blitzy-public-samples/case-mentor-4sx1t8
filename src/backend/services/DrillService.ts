// Human Tasks:
// 1. Configure Redis cache environment variables and connection settings
// 2. Set up monitoring for drill completion rates to track >80% target
// 3. Configure alerting for API response times exceeding 200ms SLA
// 4. Verify database connection pool settings for optimal performance
// 5. Set up error tracking for failed drill evaluations

import { z } from 'zod'; // ^3.22.0
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // ^2.38.0
import { Redis } from 'ioredis'; // Required for cache operations
import {
  DrillType,
  DrillStatus,
  DrillPrompt,
  DrillAttempt,
  DrillEvaluation,
  DrillDifficulty,
  DrillResponse,
  drillPromptSchema,
  drillAttemptSchema,
  drillEvaluationSchema
} from '../../types/drills';
import { DrillAttemptModel } from '../models/DrillAttempt';
import { evaluateDrillAttempt } from '../lib/drills/evaluator';

// Global constants from specification
const DRILL_CACHE_TTL = 300; // 5 minutes
const MAX_CONCURRENT_ATTEMPTS = 3;

/**
 * Core service class for managing drill operations
 * @requirement Practice Drills - Comprehensive drill management system
 * @requirement System Performance - Optimized for <200ms response time
 */
export class DrillService {
  private readonly db: SupabaseClient;
  private readonly cache: Redis;

  constructor(db: SupabaseClient, cache: Redis) {
    this.db = db;
    this.cache = cache;
  }

  /**
   * Retrieves a drill by ID with caching
   * @requirement System Performance - Cached drill data for fast retrieval
   */
  async getDrillById(drillId: string): Promise<DrillPrompt> {
    // Check cache first
    const cachedDrill = await this.cache.get(`drill:${drillId}`);
    if (cachedDrill) {
      return JSON.parse(cachedDrill);
    }

    // Fetch from database if not cached
    const { data, error } = await this.db
      .from('drills')
      .select('*')
      .eq('id', drillId)
      .single();

    if (error || !data) {
      throw new Error(`Drill not found: ${drillId}`);
    }

    // Validate drill data
    const drill = drillPromptSchema.parse(data);

    // Cache the result
    await this.cache.setex(
      `drill:${drillId}`,
      DRILL_CACHE_TTL,
      JSON.stringify(drill)
    );

    return drill;
  }

  /**
   * Lists available drills with filtering
   * @requirement Practice Drills - Filtered drill access
   */
  async listDrills(
    type?: DrillType,
    difficulty?: DrillDifficulty,
    filters: Record<string, any> = {}
  ): Promise<DrillPrompt[]> {
    let query = this.db.from('drills').select('*');

    if (type) {
      query = query.eq('type', type);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list drills: ${error.message}`);
    }

    // Validate all drill data
    return data.map(drill => drillPromptSchema.parse(drill));
  }

  /**
   * Initiates a new drill attempt
   * @requirement Practice Drills - Track user attempts
   * @requirement User Engagement - Monitor completion rates
   */
  async startDrillAttempt(
    userId: string,
    drillId: string
  ): Promise<DrillAttempt> {
    // Validate access and limits
    const canAccess = await this.validateDrillAccess(userId, drillId);
    if (!canAccess) {
      throw new Error('Access denied or attempt limit reached');
    }

    // Create new attempt
    const attempt = new DrillAttemptModel({
      id: crypto.randomUUID(),
      userId,
      drillId,
      status: DrillStatus.NOT_STARTED,
      response: '',
      startedAt: new Date(),
      completedAt: null,
      timeSpent: 0
    });

    return attempt.save();
  }

  /**
   * Submits and evaluates a drill response
   * @requirement Practice Drills - AI-powered evaluation
   */
  async submitDrillResponse(
    attemptId: string,
    response: string
  ): Promise<DrillEvaluation> {
    const attempt = await DrillAttemptModel.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== DrillStatus.IN_PROGRESS) {
      throw new Error('Invalid attempt status');
    }

    // Complete the attempt and get evaluation
    const result = await attempt.complete(response);
    
    // Process and store evaluation
    await this.processDrillEvaluation(attemptId, result.evaluation);

    return result.evaluation;
  }

  /**
   * Retrieves drill attempt history for a user
   * @requirement User Engagement - Track user progress
   */
  async getUserDrillHistory(
    userId: string,
    filters: Record<string, any> = {}
  ): Promise<DrillAttempt[]> {
    let query = this.db
      .from('drill_attempts')
      .select('*, evaluations(*)')
      .eq('user_id', userId);

    // Apply date filters
    if (filters.startDate) {
      query = query.gte('started_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('started_at', filters.endDate);
    }
    if (filters.type) {
      query = query.eq('drill_type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch drill history: ${error.message}`);
    }

    return data.map(attempt => drillAttemptSchema.parse(attempt));
  }

  /**
   * Validates user access to drill content
   * @requirement Practice Drills - Access control
   */
  private async validateDrillAccess(
    userId: string,
    drillId: string
  ): Promise<boolean> {
    // Check subscription status
    const { data: user } = await this.db
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    if (!user || user.subscription_status !== 'active') {
      return false;
    }

    // Check concurrent attempt limits
    const { count } = await this.db
      .from('drill_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', DrillStatus.IN_PROGRESS);

    if (count >= MAX_CONCURRENT_ATTEMPTS) {
      return false;
    }

    // Verify drill availability
    const drill = await this.getDrillById(drillId);
    return !!drill;
  }

  /**
   * Processes and stores drill evaluation results
   * @requirement Practice Drills - Evaluation storage
   */
  private async processDrillEvaluation(
    attemptId: string,
    evaluation: DrillEvaluation
  ): Promise<void> {
    // Validate evaluation data
    drillEvaluationSchema.parse(evaluation);

    // Store evaluation results
    const { error } = await this.db
      .from('drill_evaluations')
      .insert({
        attempt_id: attemptId,
        ...evaluation,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to store evaluation: ${error.message}`);
    }

    // Update user progress metrics
    await this.db.rpc('update_user_drill_progress', {
      p_user_id: evaluation.userId,
      p_drill_id: evaluation.drillId,
      p_score: evaluation.score
    });
  }
}
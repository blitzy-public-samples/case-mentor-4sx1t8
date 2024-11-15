/**
 * Human Tasks:
 * 1. Ensure PostgreSQL database has the following tables created:
 *    - drills: For storing drill templates
 *    - drill_attempts: For tracking user attempts
 * 2. Configure proper indexes on id, userId, and drillId columns
 * 3. Set up appropriate database triggers for timestamp management
 * 4. Verify proper CASCADE settings for foreign key constraints
 */

// @ts-check
import { PostgrestFilterBuilder, SupabaseClient } from '@supabase/postgrest-js'; // ^0.37.0
import {
  DrillTemplate,
  DrillAttempt,
  DrillType,
  DrillDifficulty,
  DrillStatus,
  EvaluationCriteria
} from '../../../types/drills';
import { supabase } from '../../../config/database';

/**
 * Core model class for drill operations in PostgreSQL database
 * Implements requirements:
 * - Practice Drills: Data model for various drill types
 * - Database Layer: Core drill table operations with read replica support
 */
export class DrillModel {
  private client: SupabaseClient;
  private readonly tableName: string = 'drills';
  private readonly attemptsTableName: string = 'drill_attempts';

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Creates a new drill template with validation
   * Requirement: Practice Drills - Structured drill templates
   */
  async create(drillData: DrillTemplate): Promise<DrillTemplate> {
    // Validate required fields
    if (!drillData.title || !drillData.description || !drillData.type || !drillData.difficulty) {
      throw new Error('Missing required drill template fields');
    }

    // Validate drill type
    const validTypes: DrillType[] = [
      'CASE_PROMPT', 'CALCULATIONS', 'CASE_MATH',
      'BRAINSTORMING', 'MARKET_SIZING', 'SYNTHESIZING'
    ];
    if (!validTypes.includes(drillData.type)) {
      throw new Error('Invalid drill type');
    }

    // Validate difficulty
    const validDifficulties: DrillDifficulty[] = [
      'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
    ];
    if (!validDifficulties.includes(drillData.difficulty)) {
      throw new Error('Invalid difficulty level');
    }

    // Validate evaluation criteria
    if (!Array.isArray(drillData.evaluationCriteria) || drillData.evaluationCriteria.length === 0) {
      throw new Error('Evaluation criteria must be a non-empty array');
    }

    // Validate time limit
    if (typeof drillData.timeLimit !== 'number' || drillData.timeLimit <= 0) {
      throw new Error('Time limit must be a positive number');
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(drillData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Retrieves a drill template by ID
   * Requirement: Database Layer - Efficient read operations
   */
  async getById(id: string): Promise<DrillTemplate | null> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid UUID format');
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Updates an existing drill template
   * Requirement: Practice Drills - Template management
   */
  async update(id: string, updateData: Partial<DrillTemplate>): Promise<DrillTemplate> {
    // Verify drill exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Drill template not found');
    }

    // Validate type if provided
    if (updateData.type) {
      const validTypes: DrillType[] = [
        'CASE_PROMPT', 'CALCULATIONS', 'CASE_MATH',
        'BRAINSTORMING', 'MARKET_SIZING', 'SYNTHESIZING'
      ];
      if (!validTypes.includes(updateData.type)) {
        throw new Error('Invalid drill type');
      }
    }

    // Validate difficulty if provided
    if (updateData.difficulty) {
      const validDifficulties: DrillDifficulty[] = [
        'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
      ];
      if (!validDifficulties.includes(updateData.difficulty)) {
        throw new Error('Invalid difficulty level');
      }
    }

    // Validate evaluation criteria if provided
    if (updateData.evaluationCriteria) {
      if (!Array.isArray(updateData.evaluationCriteria) || updateData.evaluationCriteria.length === 0) {
        throw new Error('Evaluation criteria must be a non-empty array');
      }
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Deletes a drill template and its attempts
   * Requirement: Database Layer - Transaction support
   */
  async delete(id: string): Promise<void> {
    // Verify drill exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Drill template not found');
    }

    // Delete within transaction
    const { error } = await this.client.rpc('delete_drill_with_attempts', {
      drill_id: id
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Creates a new drill attempt
   * Requirement: Practice Drills - Attempt tracking
   */
  async createAttempt(userId: string, drillId: string): Promise<DrillAttempt> {
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(drillId)) {
      throw new Error('Invalid UUID format');
    }

    // Verify drill exists
    const drill = await this.getById(drillId);
    if (!drill) {
      throw new Error('Drill template not found');
    }

    const attemptData: Partial<DrillAttempt> = {
      userId,
      drillId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      response: {},
      score: null,
      criteriaScores: {},
      feedback: null
    };

    const { data, error } = await this.client
      .from(this.attemptsTableName)
      .insert(attemptData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Updates a drill attempt
   * Requirement: Practice Drills - Progress tracking
   */
  async updateAttempt(attemptId: string, updateData: Partial<DrillAttempt>): Promise<DrillAttempt> {
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(attemptId)) {
      throw new Error('Invalid UUID format');
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses: DrillStatus[] = [
        'IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'ABANDONED'
      ];
      if (!validStatuses.includes(updateData.status)) {
        throw new Error('Invalid attempt status');
      }
    }

    // Validate score if provided
    if (updateData.score !== undefined && updateData.score !== null) {
      if (typeof updateData.score !== 'number' || updateData.score < 0 || updateData.score > 100) {
        throw new Error('Score must be a number between 0 and 100');
      }
    }

    const { data, error } = await this.client
      .from(this.attemptsTableName)
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
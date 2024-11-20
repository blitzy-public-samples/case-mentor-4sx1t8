/**
 * Database query module for case interview practice drills
 * Implements optimized PostgreSQL queries with filtering and pagination
 * 
 * Human Tasks:
 * 1. Ensure drill_templates and drill_attempts tables are created in Supabase
 * 2. Create appropriate indexes for type, difficulty, userId, and drillId columns
 * 3. Set up read replicas for horizontal scaling of drill queries
 */

import { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // ^0.37.0
import { 
  DrillTemplate, 
  DrillType, 
  DrillDifficulty, 
  DrillAttempt 
} from '../../../types/drills';
import { supabase, handleDatabaseError } from '../../../config/database';

// Pagination defaults
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Retrieves drills filtered by type with pagination support
 * Requirement: Practice Drills - Filter and paginate drills by type
 * Requirement: System Performance - Optimize for <200ms response time
 */
export async function getDrillsByType(
  type: DrillType,
  options: PaginationOptions = {}
): Promise<{ data: DrillTemplate[]; count: number }> {
  try {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    // Validate pagination limits
    const validatedLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

    // Build base query with type filter
    const baseQuery = supabase
      .from<DrillTemplate>('drill_templates')
      .select('*')
      .eq('type', type)
      .order(orderBy, { ascending: orderDirection === 'asc' });

    // Execute count query in parallel with data query
    const [dataQuery, countQuery] = await Promise.all([
      baseQuery
        .range(offset, offset + validatedLimit - 1)
        .throwOnError(),
      baseQuery
        .count()
        .throwOnError()
    ]);

    return {
      data: dataQuery.data || [],
      count: countQuery.count || 0
    };
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Retrieves drills filtered by difficulty level with pagination
 * Requirement: Practice Drills - Filter and paginate drills by difficulty
 * Requirement: System Performance - Optimize query performance
 */
export async function getDrillsByDifficulty(
  difficulty: DrillDifficulty,
  options: PaginationOptions = {}
): Promise<{ data: DrillTemplate[]; count: number }> {
  try {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    const validatedLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

    const baseQuery = supabase
      .from<DrillTemplate>('drill_templates')
      .select('*')
      .eq('difficulty', difficulty)
      .order(orderBy, { ascending: orderDirection === 'asc' });

    const [dataQuery, countQuery] = await Promise.all([
      baseQuery
        .range(offset, offset + validatedLimit - 1)
        .throwOnError(),
      baseQuery
        .count()
        .throwOnError()
    ]);

    return {
      data: dataQuery.data || [],
      count: countQuery.count || 0
    };
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

interface DrillAttemptFilters {
  status?: DrillAttempt['status'];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Retrieves all drill attempts for a specific user with drill details
 * Requirement: Practice Drills - Track user progress and attempts
 * Requirement: Database Layer - Optimize joins for performance
 */
export async function getUserDrillAttempts(
  userId: string,
  options: PaginationOptions & DrillAttemptFilters = {}
): Promise<DrillAttempt[]> {
  try {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      status,
      startDate,
      endDate
    } = options;

    let query = supabase
      .from<DrillAttempt>('drill_attempts')
      .select(`
        *,
        drill:drill_templates (*)
      `)
      .eq('userId', userId);

    // Apply optional filters
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('startedAt', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('startedAt', endDate.toISOString());
    }

    const { data, error } = await query
      .order('startedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Retrieves a specific drill attempt with full template details
 * Requirement: Practice Drills - Detailed attempt tracking
 * Requirement: Database Layer - Efficient joins
 */
export async function getDrillAttemptById(
  attemptId: string
): Promise<DrillAttempt | null> {
  try {
    const { data, error } = await supabase
      .from<DrillAttempt>('drill_attempts')
      .select(`
        *,
        drill:drill_templates (*),
        feedback:drill_feedback (*)
      `)
      .eq('id', attemptId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Retrieves aggregated statistics for drill performance
 * Requirement: Practice Drills - Performance analytics
 * Requirement: System Performance - Optimize aggregation queries
 */
export async function getDrillStats(
  drillId: string
): Promise<{ attempts: number; avgScore: number; completionRate: number }> {
  try {
    const { data, error } = await supabase
      .rpc('get_drill_statistics', { drill_id: drillId });

    if (error) throw error;

    return {
      attempts: data.total_attempts || 0,
      avgScore: data.average_score || 0,
      completionRate: data.completion_rate || 0
    };
  } catch (error) {
    throw handleDatabaseError(error);
  }
}
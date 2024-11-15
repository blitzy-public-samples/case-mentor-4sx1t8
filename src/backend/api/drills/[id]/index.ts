/**
 * API endpoint handler for retrieving individual drill details and statistics
 * 
 * Human Tasks:
 * 1. Configure Redis caching for drill details
 * 2. Set up monitoring for API response times
 * 3. Configure rate limiting for the endpoint
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { withAuth } from '../../../lib/auth/middleware';
import { getDrillAttemptById, getDrillStats } from '../../../lib/database/queries/drills';
import { DrillTemplate } from '../../../types/drills';
import { validate as validateUUID } from 'uuid'; // ^9.0.0

// Cache control settings for optimizing response times
const CACHE_CONTROL_HEADER = 'public, s-maxage=60, stale-while-revalidate=30';

/**
 * GET handler for retrieving drill details and statistics
 * Requirements addressed:
 * - Practice Drills: Implement API endpoints for accessing drill details
 * - System Performance: Ensure API response time under 200ms through caching
 * - Security Architecture: Implement secure API endpoints with JWT authentication
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate drill ID format
    const { id } = params;
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid drill ID format' },
        { status: 400 }
      );
    }

    // Fetch drill details and statistics in parallel for performance
    const [drillAttempt, drillStats] = await Promise.all([
      getDrillAttemptById(id),
      getDrillStats(id)
    ]);

    // Handle case where drill is not found
    if (!drillAttempt) {
      return NextResponse.json(
        { error: 'Drill not found' },
        { status: 404 }
      );
    }

    // Construct response object with drill details and statistics
    const response = {
      drill: {
        id: drillAttempt.drill.id,
        type: drillAttempt.drill.type,
        difficulty: drillAttempt.drill.difficulty,
        title: drillAttempt.drill.title,
        description: drillAttempt.drill.description,
        timeLimit: drillAttempt.drill.timeLimit,
        evaluationCriteria: drillAttempt.drill.evaluationCriteria
      } as DrillTemplate,
      attempt: {
        id: drillAttempt.id,
        status: drillAttempt.status,
        startedAt: drillAttempt.startedAt,
        completedAt: drillAttempt.completedAt,
        score: drillAttempt.score,
        feedback: drillAttempt.feedback
      },
      statistics: {
        totalAttempts: drillStats.attempts,
        averageScore: drillStats.avgScore,
        completionRate: drillStats.completionRate
      }
    };

    // Return response with cache control headers
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': CACHE_CONTROL_HEADER
      }
    });

  } catch (error) {
    // Log error for monitoring
    console.error('Drill details API error:', error);

    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Failed to retrieve drill details',
        message: error.message 
      },
      { status: 500 }
    );
  }
});
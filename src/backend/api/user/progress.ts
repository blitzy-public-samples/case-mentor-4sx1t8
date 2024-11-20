/**
 * Human Tasks:
 * 1. Set up monitoring for progress tracking API endpoints
 * 2. Configure rate limiting for progress endpoints
 * 3. Set up analytics event tracking for progress updates
 */

// next/server v13.0.0
import { NextResponse, NextRequest } from 'next/server';

// Internal imports
import { withAuth } from '../../lib/auth/middleware';
import { getUserProgress } from '../../lib/database/queries/users';
import { UserProgress } from '../../types/user';

/**
 * GET handler for retrieving user progress data
 * Requirements addressed:
 * - Progress Tracking: Track user progress and performance analytics
 * - Performance Analytics: Provide detailed analytics on user performance
 */
export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Extract user ID from authenticated request context
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request context' },
        { status: 400 }
      );
    }

    // Retrieve raw progress data
    const progressData = await getUserProgress(userId);

    // Calculate additional metrics and insights
    const enrichedMetrics = calculateProgressMetrics(progressData);

    // Return combined progress data and metrics
    return NextResponse.json({
      progress: progressData,
      metrics: enrichedMetrics
    }, { status: 200 });

  } catch (error) {
    console.error('Error retrieving user progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress data' },
      { status: 500 }
    );
  }
});

/**
 * Calculates derived progress metrics and insights
 * Requirements addressed:
 * - Performance Analytics: Provide detailed analytics on user performance
 */
function calculateProgressMetrics(progress: UserProgress) {
  // Calculate completion rates by drill type
  const drillTypeCompletionRates = Object.entries(progress.drillTypeProgress)
    .reduce((acc, [drillType, score]) => ({
      ...acc,
      [drillType]: {
        score,
        completionRate: (score / 100) * 100, // Convert to percentage
        status: score >= 80 ? 'Mastered' : score >= 60 ? 'In Progress' : 'Needs Work'
      }
    }), {});

  // Calculate performance trends
  const performanceTrends = {
    overallProgress: (progress.totalDrillsCompleted * progress.averageScore) / 100,
    strengthCount: progress.strengthAreas.length,
    improvementCount: progress.improvementAreas.length,
    masteryLevel: progress.averageScore >= 80 ? 'Advanced' :
      progress.averageScore >= 60 ? 'Intermediate' : 'Beginner'
  };

  // Generate personalized recommendations
  const recommendations = progress.improvementAreas.map(area => ({
    area,
    suggestion: `Focus on ${area} drills to improve performance`,
    targetScore: Math.min(progress.drillTypeProgress[area] + 15, 100)
  }));

  // Compile insights
  const insights = {
    topStrengths: progress.strengthAreas.slice(0, 3),
    priorityImprovements: progress.improvementAreas.slice(0, 3),
    recentActivity: {
      lastActive: progress.lastActivityAt,
      daysSinceActive: Math.floor(
        (Date.now() - progress.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  };

  return {
    drillTypeCompletionRates,
    performanceTrends,
    recommendations,
    insights,
    lastUpdated: new Date()
  };
}
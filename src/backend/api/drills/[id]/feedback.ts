/**
 * API endpoint handler for retrieving and generating AI-powered feedback for drill attempts
 * 
 * Human Tasks:
 * 1. Configure OpenAI API key in environment variables
 * 2. Set up monitoring for feedback generation response times
 * 3. Configure error tracking for feedback generation failures
 */

// next/server v13.0.0
import { NextResponse, NextRequest } from 'next/server';

// Internal imports with relative paths
import { DrillFeedback } from '../../../types/drills';
import { FeedbackGenerator } from '../../../lib/ai/feedback-generator';
import { withAuth } from '../../../lib/auth/middleware';
import { getDrillAttemptById } from '../../../lib/database/queries/drills';

/**
 * Retrieves existing feedback for a drill attempt or generates new feedback if none exists
 * Requirement: Practice Drills - Provide detailed AI-powered feedback for all drill types
 * Requirement: System Performance - Ensure API response time under 200ms
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate attempt ID format
    if (!params.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid drill attempt ID format' },
        { status: 400 }
      );
    }

    // Retrieve drill attempt details
    const attempt = await getDrillAttemptById(params.id);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Drill attempt not found' },
        { status: 404 }
      );
    }

    // Check user permission
    const authContext = (req as any).auth;
    if (attempt.userId !== authContext.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to drill attempt' },
        { status: 403 }
      );
    }

    // Return cached feedback if exists
    if (attempt.feedback) {
      return NextResponse.json(attempt.feedback);
    }

    // Prepare feedback context
    const feedbackContext = {
      drillType: attempt.drill.type,
      criteriaScores: attempt.criteriaScores,
      evaluationResult: {
        overallScore: attempt.score,
        response: attempt.response
      }
    };

    // Generate new feedback
    const feedbackGenerator = new FeedbackGenerator(
      global.openaiClient,
      global.drillEvaluator
    );

    const feedback = await feedbackGenerator.generateFeedback(
      attempt,
      feedbackContext,
      {
        detailed: true,
        includeExamples: true,
        maxSuggestions: 3
      }
    );

    return NextResponse.json(feedback);

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
});

/**
 * Forces regeneration of feedback for a drill attempt
 * Requirement: Practice Drills - Provide detailed AI-powered feedback for all drill types
 * Requirement: System Performance - Ensure API response time under 200ms
 */
export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate attempt ID format
    if (!params.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid drill attempt ID format' },
        { status: 400 }
      );
    }

    // Retrieve drill attempt details
    const attempt = await getDrillAttemptById(params.id);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Drill attempt not found' },
        { status: 404 }
      );
    }

    // Check user permission
    const authContext = (req as any).auth;
    if (attempt.userId !== authContext.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to drill attempt' },
        { status: 403 }
      );
    }

    // Prepare feedback context
    const feedbackContext = {
      drillType: attempt.drill.type,
      criteriaScores: attempt.criteriaScores,
      evaluationResult: {
        overallScore: attempt.score,
        response: attempt.response
      }
    };

    // Generate new feedback
    const feedbackGenerator = new FeedbackGenerator(
      global.openaiClient,
      global.drillEvaluator
    );

    const feedback = await feedbackGenerator.generateFeedback(
      attempt,
      feedbackContext,
      {
        detailed: true,
        includeExamples: true,
        maxSuggestions: 3
      }
    );

    return NextResponse.json(feedback);

  } catch (error) {
    console.error('Feedback regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate feedback' },
      { status: 500 }
    );
  }
});
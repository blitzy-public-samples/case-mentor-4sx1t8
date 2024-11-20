/**
 * API endpoint handler for evaluating user responses to case interview practice drills
 * using AI-powered evaluation with <200ms response time target.
 * 
 * Human Tasks:
 * 1. Monitor response times to ensure <200ms target is met
 * 2. Set up error monitoring and alerting for evaluation failures
 * 3. Configure rate limiting for the endpoint
 * 4. Review and tune evaluation criteria weights periodically
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { 
  DrillTemplate,
  DrillAttempt,
  DrillStatus
} from '../../../types/drills';
import { DrillEvaluator } from '../../../lib/ai/evaluator';
import { withAuth } from '../../../lib/auth/middleware';
import { getDrillAttemptById } from '../../../lib/database/queries/drills';

/**
 * Handles POST requests to evaluate a completed drill attempt
 * Requirement: AI evaluation - Implements OpenAI-based evaluation
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const attemptId = params.id;
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Missing drill attempt ID' },
        { status: 400 }
      );
    }

    // Retrieve drill attempt with template data
    const attempt = await getDrillAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Drill attempt not found' },
        { status: 404 }
      );
    }

    // Validate attempt belongs to authenticated user
    if (attempt.userId !== (req as any).auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to drill attempt' },
        { status: 403 }
      );
    }

    // Check attempt status
    if (attempt.status !== DrillStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Drill attempt must be completed before evaluation' },
        { status: 400 }
      );
    }

    // Initialize evaluator with 200ms timeout target
    const evaluator = new DrillEvaluator(
      global.openaiClient, // Initialized in app bootstrap
      3 // Max retries
    );

    // Evaluate response with performance optimization
    const evaluationResult = await evaluator.evaluateResponse(
      attempt.drill as DrillTemplate,
      attempt,
      {
        detailed: true,
        streaming: false,
        timeout: 200 // 200ms target response time
      }
    );

    // Update attempt with evaluation results
    const updatedAttempt = await global.supabase
      .from('drill_attempts')
      .update({
        status: DrillStatus.EVALUATED,
        score: evaluationResult.overallScore,
        criteriaScores: evaluationResult.criteriaScores,
        feedback: evaluationResult.feedback,
        evaluatedAt: new Date().toISOString()
      })
      .eq('id', attemptId)
      .single();

    if (updatedAttempt.error) {
      throw new Error('Failed to update drill attempt with evaluation results');
    }

    // Return evaluation results
    return NextResponse.json({
      success: true,
      data: {
        attemptId,
        ...evaluationResult
      }
    });

  } catch (error) {
    console.error('Drill evaluation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Evaluation failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}, {
  requiredPermissions: ['EVALUATE_DRILL']
});
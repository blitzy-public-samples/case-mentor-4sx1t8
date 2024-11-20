// Human Tasks:
// 1. Set up monitoring for API response times to ensure <200ms SLA
// 2. Configure error tracking for failed drill attempts
// 3. Set up analytics for drill completion rate tracking
// 4. Review and adjust rate limiting settings if needed

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { DrillService } from '../../../services/DrillService';
import { withAuth, requireSubscription } from '../../../lib/auth/middleware';
import {
  DrillResponse,
  DrillPrompt,
  DrillAttempt,
  DrillEvaluation,
  DrillStatus
} from '../../../types/drills';

/**
 * Retrieves a specific drill by ID
 * @requirement Practice Drills - Access to various drill types
 * @requirement System Performance - Optimized for <200ms response time
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<DrillResponse<DrillPrompt>>> => {
    try {
      const drillService = new DrillService();
      const drill = await drillService.getDrillById(params.id);

      return NextResponse.json({
        success: true,
        data: drill,
        error: null
      });
    } catch (error) {
      console.error(`Error fetching drill ${params.id}:`, error);
      return NextResponse.json(
        {
          success: false,
          data: null as any,
          error: error instanceof Error ? error.message : 'Failed to fetch drill'
        },
        { status: 404 }
      );
    }
  },
  { requireAuth: true }
);

/**
 * Handles drill attempt creation and response submission
 * @requirement Practice Drills - Track and evaluate user attempts
 * @requirement User Engagement - >80% completion rate tracking
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<DrillResponse<DrillAttempt | DrillEvaluation>>> => {
    try {
      const drillService = new DrillService();
      const body = await request.json();
      const { action, response } = body;
      const userId = request.headers.get('x-user-id');

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      if (action === 'start') {
        const attempt = await drillService.startDrillAttempt(userId, params.id);
        return NextResponse.json({
          success: true,
          data: attempt,
          error: null
        });
      } else if (action === 'submit') {
        if (!body.attemptId) {
          throw new Error('Attempt ID is required for submission');
        }

        const evaluation = await drillService.submitDrillResponse(
          body.attemptId,
          response
        );

        return NextResponse.json({
          success: true,
          data: evaluation,
          error: null
        });
      } else {
        throw new Error('Invalid action specified');
      }
    } catch (error) {
      console.error(`Error processing drill ${params.id} action:`, error);
      return NextResponse.json(
        {
          success: false,
          data: null as any,
          error: error instanceof Error ? error.message : 'Failed to process drill action'
        },
        { status: 400 }
      );
    }
  },
  { requireAuth: true }
);

// Apply subscription requirement middleware to both handlers
export const { GET: AuthenticatedGET, POST: AuthenticatedPOST } = {
  GET: requireSubscription(['BASIC', 'PREMIUM'])(GET),
  POST: requireSubscription(['BASIC', 'PREMIUM'])(POST)
};
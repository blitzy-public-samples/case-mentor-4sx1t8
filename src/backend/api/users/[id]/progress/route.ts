// Human Tasks:
// 1. Configure monitoring alerts for API response times exceeding 200ms
// 2. Set up error tracking for failed progress retrievals
// 3. Verify cache configuration aligns with business requirements
// 4. Configure rate limiting parameters for progress endpoints

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { withAuth } from '../../../../lib/auth/middleware';
import { UserService } from '../../../../services/UserService';
import { UserProgress } from '../../../../types/user';

/**
 * GET handler for retrieving user progress data
 * Requirements addressed:
 * - User Management: Progress tracking, performance analytics for consulting interview preparation
 * - System Performance: <200ms API response time for 95% of requests
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Start performance timer for monitoring
    const startTime = performance.now();

    // Validate user ID format
    if (!params.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format',
          details: { id: params.id }
        },
        { status: 400 }
      );
    }

    // Initialize service and retrieve progress data
    const userService = new UserService();
    const progress: UserProgress = await userService.getUserProgress(params.id);

    // Calculate response time for monitoring
    const responseTime = performance.now() - startTime;

    // Prepare response with appropriate cache headers
    const response = NextResponse.json(progress, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Response-Time': `${responseTime.toFixed(2)}ms`
      }
    });

    // Log metrics for performance monitoring
    if (responseTime > 200) {
      console.warn(`[Performance Warning] Progress retrieval exceeded 200ms: ${responseTime.toFixed(2)}ms`);
    }

    return response;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          {
            code: 'NOT_FOUND',
            message: 'User not found',
            details: { id: params.id }
          },
          { status: 404 }
        );
      }

      if (error.message === 'No active subscription found') {
        return NextResponse.json(
          {
            code: 'SUBSCRIPTION_ERROR',
            message: 'No active subscription found',
            details: { id: params.id }
          },
          { status: 403 }
        );
      }

      if (error.message === 'Usage limit exceeded for progress tracking') {
        return NextResponse.json(
          {
            code: 'USAGE_LIMIT_ERROR',
            message: 'Progress tracking usage limit exceeded',
            details: { id: params.id }
          },
          { status: 429 }
        );
      }
    }

    // Log unexpected errors
    console.error('[Progress API Error]', error);

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving progress data',
        details: {}
      },
      { status: 500 }
    );
  }
});
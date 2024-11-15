// Human Tasks:
// 1. Set up monitoring for feedback API endpoint latency
// 2. Configure rate limiting for feedback generation endpoints
// 3. Implement request logging for feedback operations
// 4. Set up alerts for high error rates

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { FeedbackService } from '../../services/FeedbackService';
import { withAuth } from '../../lib/auth/middleware';
import { APIError, APIErrorCode } from '../../lib/errors/APIError';

// Initialize FeedbackService
const feedbackService = new FeedbackService(/* openAIService instance will be injected */);

/**
 * GET handler for retrieving feedback
 * @requirement AI Evaluation - Core service providing consistent, objective feedback
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');
    const attemptId = searchParams.get('attemptId');

    if (!feedbackId && !attemptId) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Either feedbackId or attemptId is required',
        {},
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    let feedback;
    if (feedbackId) {
      feedback = await feedbackService.getFeedback(feedbackId);
      if (!feedback) {
        throw new APIError(
          APIErrorCode.NOT_FOUND,
          'Feedback not found',
          { feedbackId },
          request.headers.get('x-request-id') || 'unknown'
        );
      }
    } else {
      feedback = await feedbackService.getAttemptFeedback(attemptId!);
    }

    return NextResponse.json({ data: feedback });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: error.code === APIErrorCode.NOT_FOUND ? 404 : 400 });
    }
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to retrieve feedback',
        { error },
        request.headers.get('x-request-id') || 'unknown'
      ).toJSON(),
      { status: 500 }
    );
  }
});

/**
 * POST handler for generating new feedback
 * @requirement Progress Tracking - Performance analytics and progress tracking
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { attemptId, type, response } = body;

    if (!attemptId || !type || !response) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Missing required fields',
        { required: ['attemptId', 'type', 'response'] },
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    const feedback = await feedbackService.generateFeedback(
      attemptId,
      type,
      response
    );

    return NextResponse.json({ data: feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to generate feedback',
        { error },
        request.headers.get('x-request-id') || 'unknown'
      ).toJSON(),
      { status: 500 }
    );
  }
});

/**
 * PATCH handler for updating existing feedback
 * @requirement Progress Tracking - Performance analytics and progress tracking
 */
export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');

    if (!feedbackId) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Feedback ID is required',
        {},
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    const updateData = await request.json();
    await feedbackService.updateFeedback(feedbackId, updateData);

    return NextResponse.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), {
        status: error.code === APIErrorCode.NOT_FOUND ? 404 : 400
      });
    }
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to update feedback',
        { error },
        request.headers.get('x-request-id') || 'unknown'
      ).toJSON(),
      { status: 500 }
    );
  }
});
import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0
import { FeedbackService } from '../../../services/FeedbackService';
import { withAuth } from '../../../lib/auth/middleware';
import { APIError, APIErrorCode } from '../../../types/api';

// Human Tasks:
// 1. Set up monitoring for feedback API endpoint performance
// 2. Configure rate limiting for feedback operations
// 3. Implement audit logging for feedback modifications

/**
 * @fileoverview API route handler for managing individual feedback entries
 * Requirements addressed:
 * - AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
 * - Progress Tracking (3. SCOPE/Core Features/User Management)
 */

// Initialize feedback service instance
const feedbackService = new FeedbackService();

// Validation schema for feedback updates
const updateFeedbackSchema = z.object({
  content: z.object({
    summary: z.string().optional(),
    strengths: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    detailedAnalysis: z.string().optional()
  }).optional(),
  score: z.number().min(0).max(100).optional(),
  metrics: z.array(z.object({
    name: z.string(),
    score: z.number(),
    feedback: z.string(),
    category: z.string()
  })).optional()
});

/**
 * GET handler for retrieving individual feedback entries
 * @requirement AI Evaluation - Core Services
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const feedback = await feedbackService.getFeedback(params.id);
    
    if (!feedback) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.NOT_FOUND,
          message: 'Feedback not found',
          details: { feedbackId: params.id }
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      error: null,
      metadata: {}
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error as APIError
    }, { status: 500 });
  }
});

/**
 * PATCH handler for updating feedback entries
 * @requirement Progress Tracking - User Management
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const validatedData = updateFeedbackSchema.parse(body);

    await feedbackService.updateFeedback(params.id, validatedData);

    return NextResponse.json({
      success: true,
      data: { message: 'Feedback updated successfully' },
      error: null,
      metadata: {}
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_ERROR,
          message: 'Invalid update data',
          details: error.errors
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error as APIError
    }, { status: error instanceof APIError ? 404 : 500 });
  }
});

/**
 * DELETE handler for removing feedback entries
 * @requirement Progress Tracking - User Management
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Verify feedback exists before deletion
    const feedback = await feedbackService.getFeedback(params.id);
    
    if (!feedback) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.NOT_FOUND,
          message: 'Feedback not found',
          details: { feedbackId: params.id }
        }
      }, { status: 404 });
    }

    await feedbackService.deleteFeedback(params.id);

    return NextResponse.json({
      success: true,
      data: { message: 'Feedback deleted successfully' },
      error: null,
      metadata: {}
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error as APIError
    }, { status: 500 });
  }
});
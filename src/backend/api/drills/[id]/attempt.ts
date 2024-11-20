/**
 * API endpoint handler for submitting and managing drill attempt responses
 * 
 * Human Tasks:
 * 1. Configure monitoring for drill attempt response times
 * 2. Set up alerts for failed attempt submissions
 * 3. Configure rate limiting for attempt submissions
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { z } from 'zod'; // ^3.22.0
import { DrillAttempt } from '../../../types/drills';
import { withAuth } from '../../../lib/auth/middleware';
import { getDrillAttemptById } from '../../../lib/database/queries/drills';
import { validateRequest } from '../../../lib/utils/validation';

// Schema for validating drill attempt submissions
const ATTEMPT_SCHEMA = z.object({
  response: z.record(z.string(), z.any()),
  timeSpent: z.number().min(0)
});

/**
 * POST handler for creating new drill attempts
 * Requirement: Practice Drills - Handle user drill attempt submissions
 */
export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Extract drill ID from route parameters
    const drillId = params.id;
    if (!drillId) {
      return NextResponse.json(
        { error: 'Drill ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = await validateRequest(body, ATTEMPT_SCHEMA);

    // Create new drill attempt record
    const attempt: Partial<DrillAttempt> = {
      userId: (req as any).auth.userId,
      drillId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      completedAt: null,
      response: validatedData.response
    };

    // Store attempt in database
    const { data, error } = await supabase
      .from('drill_attempts')
      .insert([attempt])
      .single();

    if (error) throw error;

    // Return attempt details
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create drill attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create drill attempt' },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating existing drill attempts
 * Requirement: User Management - Track user progress through drill attempts
 */
export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Extract attempt ID from route parameters
    const attemptId = params.id;
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = await validateRequest(body, ATTEMPT_SCHEMA);

    // Retrieve existing attempt
    const existingAttempt = await getDrillAttemptById(attemptId);
    if (!existingAttempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Verify attempt ownership
    if (existingAttempt.userId !== (req as any).auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this attempt' },
        { status: 403 }
      );
    }

    // Update attempt record
    const updates = {
      response: validatedData.response,
      status: 'COMPLETED' as const,
      completedAt: new Date()
    };

    const { data, error } = await supabase
      .from('drill_attempts')
      .update(updates)
      .eq('id', attemptId)
      .single();

    if (error) throw error;

    // Return updated attempt
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update drill attempt:', error);
    return NextResponse.json(
      { error: 'Failed to update drill attempt' },
      { status: 500 }
    );
  }
});

/**
 * GET handler for retrieving drill attempt details
 * Requirement: User Management - Track user progress through drill attempts
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Extract attempt ID from route parameters
    const attemptId = params.id;
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Retrieve attempt details
    const attempt = await getDrillAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Verify attempt ownership
    if (attempt.userId !== (req as any).auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this attempt' },
        { status: 403 }
      );
    }

    // Return attempt details
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Failed to retrieve drill attempt:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve drill attempt' },
      { status: 500 }
    );
  }
});
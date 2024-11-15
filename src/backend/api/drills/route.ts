// Human Tasks:
// 1. Configure rate limiting for drill API endpoints
// 2. Set up monitoring for API response times to track <200ms SLA
// 3. Configure Redis caching parameters for optimal performance
// 4. Set up alerts for drill completion rate dropping below 80%

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0
import { withAuth } from '../../lib/auth/middleware';
import { DrillService } from '../../services/DrillService';
import {
  DrillType,
  DrillPrompt,
  DrillAttempt,
  DrillEvaluation,
  DrillResponse,
  DrillDifficulty
} from '../../types/drills';

// Global constants from specification
const CACHE_TTL = 300;
const MAX_PAGE_SIZE = 50;

// Request validation schemas
const listDrillsSchema = z.object({
  type: z.nativeEnum(DrillType).optional(),
  difficulty: z.nativeEnum(DrillDifficulty).optional(),
  industry: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20)
});

const startDrillSchema = z.object({
  drillId: z.string().uuid()
});

const submitDrillSchema = z.object({
  attemptId: z.string().uuid(),
  response: z.string().min(1)
});

const drillService = new DrillService(/* inject dependencies */);

/**
 * GET /api/drills - List available drills with filtering and pagination
 * @requirement Practice Drills - Filtered access to practice content
 * @requirement System Performance - Cached responses for <200ms response time
 */
export const GET = withAuth(async (
  request: NextRequest
): Promise<NextResponse> => {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const params = listDrillsSchema.parse({
      type: url.searchParams.get('type'),
      difficulty: url.searchParams.get('difficulty'),
      industry: url.searchParams.get('industry'),
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    });

    // Get drills with filters
    const drills = await drillService.listDrills(
      params.type,
      params.difficulty,
      {
        industry: params.industry,
        offset: (params.page - 1) * params.pageSize,
        limit: params.pageSize
      }
    );

    // Return response with cache headers
    return new NextResponse(
      JSON.stringify({
        success: true,
        data: drills,
        error: null
      } as DrillResponse<DrillPrompt[]>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as DrillResponse<null>,
      { status: 400 }
    );
  }
});

/**
 * POST /api/drills - Start a new drill attempt
 * @requirement Practice Drills - Track user attempts
 * @requirement User Engagement - Monitor completion rates
 */
export const POST = withAuth(async (
  request: NextRequest,
  { user }
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { drillId } = startDrillSchema.parse(body);

    const attempt = await drillService.startDrillAttempt(user.id, drillId);

    return NextResponse.json({
      success: true,
      data: attempt,
      error: null
    } as DrillResponse<DrillAttempt>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as DrillResponse<null>,
      { status: 400 }
    );
  }
});

/**
 * PUT /api/drills - Submit drill response and get evaluation
 * @requirement Practice Drills - AI-powered evaluation system
 * @requirement User Engagement - Track completion rates
 */
export const PUT = withAuth(async (
  request: NextRequest
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { attemptId, response } = submitDrillSchema.parse(body);

    const evaluation = await drillService.submitDrillResponse(attemptId, response);

    return NextResponse.json({
      success: true,
      data: evaluation,
      error: null
    } as DrillResponse<DrillEvaluation>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as DrillResponse<null>,
      { status: 400 }
    );
  }
});
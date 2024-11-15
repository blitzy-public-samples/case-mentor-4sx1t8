/**
 * API endpoint handler for retrieving case interview practice drills
 * with filtering, pagination and access control
 * 
 * Human Tasks:
 * 1. Configure rate limiting for the API endpoint
 * 2. Set up monitoring for API response times
 * 3. Configure caching headers for drill responses
 */

// next/server v13.0.0
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { DrillTemplate, DrillType, DrillDifficulty } from '../../../types/drills';
import { getDrillsByType, getDrillsByDifficulty } from '../../../lib/database/queries/drills';
import { withAuth } from '../../../lib/auth/middleware';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * GET handler for drills endpoint
 * Requirements addressed:
 * - Practice Drills: Provide API access to all drill types with filtering
 * - System Performance: Ensure response time under 200ms through optimized queries
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Extract and parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extract filter parameters
    const type = searchParams.get('type') as DrillType;
    const difficulty = searchParams.get('difficulty') as DrillDifficulty;

    // Extract and validate pagination parameters
    const page = Math.max(
      parseInt(searchParams.get('page') || String(DEFAULT_PAGE)),
      1
    );
    const limit = Math.min(
      Math.max(
        parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
        1
      ),
      MAX_LIMIT
    );

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Prepare pagination options
    const options = {
      limit,
      offset,
      orderBy: 'created_at',
      orderDirection: 'desc' as const
    };

    let result: { data: DrillTemplate[]; count: number };

    // Apply filters based on query parameters
    if (type && Object.values(DrillType).includes(type)) {
      result = await getDrillsByType(type, options);
    } else if (difficulty && Object.values(DrillDifficulty).includes(difficulty)) {
      result = await getDrillsByDifficulty(difficulty, options);
    } else {
      // Return 400 if invalid filter parameters are provided
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(result.count / limit);

    // Return paginated response with metadata
    return NextResponse.json({
      data: result.data,
      pagination: {
        page,
        limit,
        totalItems: result.count,
        totalPages
      }
    }, {
      headers: {
        // Add cache control headers for performance
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });

  } catch (error) {
    console.error('Error fetching drills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  // Require authentication and READ_DRILLS permission
  optional: false,
  requiredPermissions: ['READ_DRILLS']
});
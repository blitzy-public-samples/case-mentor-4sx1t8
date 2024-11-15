/**
 * API endpoint handler for retrieving paginated list of user's ecosystem simulations
 * with filtering capabilities and rate limiting
 * 
 * Human Tasks:
 * 1. Set up monitoring for rate limit breaches
 * 2. Configure alerts for high API latency (>200ms)
 * 3. Verify database indexes are created for optimal query performance
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { SimulationState } from '../../../types/simulation';
import { withAuth } from '../../lib/auth/middleware';
import { getUserSimulations } from '../../lib/database/queries/simulations';
import { rateLimitConfig, createRateLimitInfo, RATE_LIMIT_ERROR_MESSAGES } from '../../config/rate-limit';

// Interface for simulation list filtering options
interface SimulationFilters {
  status?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

// Interface for pagination parameters
interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * GET handler for retrieving paginated simulation list
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios
 * - System Performance: Maintain <200ms API response time
 */
export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const auth = (req as any).auth;

    // Extract and validate pagination parameters
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '10'),
      50 // Maximum page size
    );

    // Validate pagination parameters
    if (isNaN(page) || page < 0) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    // Extract and validate filter parameters
    const filters: SimulationFilters = {};
    
    const status = url.searchParams.get('status');
    if (status) {
      filters.status = status;
    }

    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate format' },
            { status: 400 }
          );
        }
        filters.dateRange.startDate = startDate;
      }
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate format' },
            { status: 400 }
          );
        }
        filters.dateRange.endDate = endDate;
      }
    }

    // Apply rate limiting based on subscription tier
    const tierConfig = rateLimitConfig[auth.tier || 'free'];
    const now = Date.now();
    const resetTime = now + tierConfig.windowMs;

    // Check if rate limit is exceeded
    if (auth.rateLimitRemaining <= 0) {
      return NextResponse.json(
        { error: RATE_LIMIT_ERROR_MESSAGES.EXCEEDED },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': tierConfig.requestsPerHour.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': Math.ceil((resetTime - now) / 1000).toString()
          }
        }
      );
    }

    // Retrieve simulations with pagination and filtering
    const { data: simulations, count } = await getUserSimulations(
      auth.userId,
      {
        status: filters.status,
        startDate: filters.dateRange?.startDate ? new Date(filters.dateRange.startDate) : undefined,
        endDate: filters.dateRange?.endDate ? new Date(filters.dateRange.endDate) : undefined
      },
      { page, limit }
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPreviousPage = page > 0;

    // Create rate limit info for response headers
    const rateLimitInfo = createRateLimitInfo(
      tierConfig.requestsPerHour,
      auth.rateLimitRemaining - 1,
      resetTime,
      auth.tier
    );

    // Return paginated results with metadata
    return NextResponse.json(
      {
        data: simulations,
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.reset.toString()
        }
      }
    );

  } catch (error) {
    console.error('Error retrieving simulations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve simulations' },
      { status: 500 }
    );
  }
});
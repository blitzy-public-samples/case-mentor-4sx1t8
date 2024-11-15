// @ts-check
import { z } from 'zod'; // ^3.22.0
import { DrillType } from './drills';
import { SimulationStatus } from './simulation';
import { UserSubscriptionTier as UserRole } from './user';

// Human Tasks:
// 1. Configure rate limiting parameters in environment variables
// 2. Set up monitoring for API response times to ensure <200ms SLA
// 3. Implement request ID generation and tracking
// 4. Configure error reporting and monitoring system

/**
 * @fileoverview Core API type definitions and interfaces
 * Requirements addressed:
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 * - API Design (7. SYSTEM DESIGN/7.3 API Design)
 * - Security Controls (7. SYSTEM DESIGN/7.3 API Design/7.3.6 Security Controls)
 */

/**
 * Supported HTTP methods for API endpoints
 * Requirement: API Design - RESTful API implementation
 */
export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
}

/**
 * Standardized API error codes
 * Requirement: API Design - Standardized error handling
 */
export enum APIErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Standardized API error response structure
 * Requirement: API Design - Consistent error handling
 */
export interface APIError {
    code: APIErrorCode;
    message: string;
    details: Record<string, any>;
    timestamp: string;
    requestId: string;
}

/**
 * Generic API response wrapper
 * Requirement: API Design - Standardized response format
 */
export interface APIResponse<T> {
    success: boolean;
    data: T;
    error: APIError | null;
    metadata: Record<string, any>;
}

/**
 * Standard pagination parameters
 * Requirement: API Design - Consistent pagination
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

/**
 * Generic paginated response structure
 * Requirement: API Design - Standardized pagination response
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}

/**
 * Rate limit information structure
 * Requirement: Security Controls - Rate limiting
 */
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

// Zod schemas for runtime validation

export const apiErrorSchema = z.object({
    code: z.nativeEnum(APIErrorCode),
    message: z.string(),
    details: z.record(z.any()),
    timestamp: z.string().datetime(),
    requestId: z.string().uuid()
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema,
        error: apiErrorSchema.nullable(),
        metadata: z.record(z.any())
    });

export const paginationParamsSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    sortBy: z.string(),
    sortOrder: z.enum(['asc', 'desc'])
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number().int().min(0),
        page: z.number().int().min(1),
        totalPages: z.number().int().min(0),
        hasMore: z.boolean()
    });

export const rateLimitInfoSchema = z.object({
    limit: z.number().int().positive(),
    remaining: z.number().int().min(0),
    reset: z.number().int().positive()
});
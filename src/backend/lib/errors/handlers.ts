/**
 * @fileoverview Error handling middleware and utility functions for standardized error handling
 * Requirements addressed:
 * - Error Handling (7. SYSTEM DESIGN/7.3 API Design/7.3.5 Error Handling)
 * - API Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details/API Layer)
 * 
 * Human Tasks:
 * 1. Configure error monitoring service integration
 * 2. Set up error rate alerting thresholds
 * 3. Define error severity levels for different error types
 * 4. Establish error tracking workflow with development team
 */

import { NextResponse } from 'next/server'; // ^13.0.0
import { ZodError } from 'zod'; // ^3.22.0
import { APIError } from './APIError';
import { APIErrorCode, type APIResponse } from '../../types/api';

/**
 * Global error handler that converts various error types into standardized APIError responses
 * Requirement: Standardized error handling with error codes, messages, and details
 */
export function handleError(error: Error, requestId: string): NextResponse<APIResponse> {
    let apiError: APIError;
    let statusCode: number;

    // Handle already formatted API errors
    if (error instanceof APIError) {
        apiError = error;
        statusCode = getStatusCodeForError(error.code);
    }
    // Handle validation errors
    else if (error instanceof ZodError) {
        const response = handleValidationError(error, requestId);
        return response;
    }
    // Handle authentication/authorization errors
    else if (error.name === 'AuthError' || error.name === 'UnauthorizedError') {
        const response = handleAuthError(error, requestId);
        return response;
    }
    // Handle rate limit errors
    else if (error.name === 'RateLimitError') {
        const response = handleRateLimitError(error, requestId);
        return response;
    }
    // Handle unknown errors
    else {
        apiError = new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'An unexpected error occurred',
            { originalError: error.message },
            requestId
        );
        statusCode = 500;
    }

    const errorResponse: APIResponse = {
        success: false,
        data: null,
        error: apiError,
        metadata: {}
    };

    return new NextResponse(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
        }
    });
}

/**
 * Handles validation errors from Zod schema validation
 * Requirement: Field-level validation error details
 */
export function handleValidationError(error: ZodError, requestId: string): NextResponse<APIResponse> {
    const fieldErrors: Record<string, string[]> = {};
    
    error.errors.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
    });

    const apiError = new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Validation error',
        { fields: fieldErrors },
        requestId
    );

    const errorResponse: APIResponse = {
        success: false,
        data: null,
        error: apiError,
        metadata: {}
    };

    return new NextResponse(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
        }
    });
}

/**
 * Handles authentication and authorization errors
 * Requirement: Clear distinction between authentication and authorization failures
 */
export function handleAuthError(error: Error, requestId: string): NextResponse<APIResponse> {
    const isAuthenticationError = error.name === 'AuthError';
    const errorCode = isAuthenticationError 
        ? APIErrorCode.AUTHENTICATION_ERROR 
        : APIErrorCode.AUTHORIZATION_ERROR;
    
    const statusCode = isAuthenticationError ? 401 : 403;
    const message = isAuthenticationError
        ? 'Authentication failed'
        : 'Insufficient permissions';

    const apiError = new APIError(
        errorCode,
        message,
        { originalError: error.message },
        requestId
    );

    const errorResponse: APIResponse = {
        success: false,
        data: null,
        error: apiError,
        metadata: {}
    };

    return new NextResponse(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
        }
    });
}

/**
 * Handles rate limit exceeded errors
 * Requirement: Rate limiting with retry information
 */
export function handleRateLimitError(error: Error, requestId: string): NextResponse<APIResponse> {
    const retryAfter = (error as any).retryAfter || 60; // Default to 60 seconds if not specified

    const apiError = new APIError(
        APIErrorCode.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        {
            retryAfter,
            retryAt: new Date(Date.now() + (retryAfter * 1000)).toISOString()
        },
        requestId
    );

    const errorResponse: APIResponse = {
        success: false,
        data: null,
        error: apiError,
        metadata: {}
    };

    return new NextResponse(JSON.stringify(errorResponse), {
        status: 429,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Retry-After': String(retryAfter)
        }
    });
}

/**
 * Maps APIErrorCode to HTTP status codes
 */
function getStatusCodeForError(code: APIErrorCode): number {
    switch (code) {
        case APIErrorCode.VALIDATION_ERROR:
            return 400;
        case APIErrorCode.AUTHENTICATION_ERROR:
            return 401;
        case APIErrorCode.AUTHORIZATION_ERROR:
            return 403;
        case APIErrorCode.NOT_FOUND:
            return 404;
        case APIErrorCode.RATE_LIMIT_ERROR:
            return 429;
        case APIErrorCode.INTERNAL_ERROR:
        default:
            return 500;
    }
}
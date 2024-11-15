/**
 * @fileoverview Custom error class for standardized API error handling
 * Requirements addressed:
 * - Error Handling (7. SYSTEM DESIGN/7.3 API Design/7.3.5 Error Handling)
 * - API Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details/API Layer)
 * 
 * Human Tasks:
 * 1. Set up error monitoring and alerting system integration
 * 2. Configure error logging aggregation service
 * 3. Establish error tracking and analysis workflow
 */

import { APIErrorCode } from '../../types/api';

/**
 * Custom error class that extends Error to provide standardized API error handling
 * with additional context and serialization capabilities.
 */
export class APIError extends Error {
    public readonly code: APIErrorCode;
    public readonly message: string;
    public readonly details: Record<string, any>;
    public readonly timestamp: string;
    public readonly requestId: string;

    /**
     * Creates a new APIError instance with standardized error properties
     * @param code - Error classification code from APIErrorCode enum
     * @param message - Human-readable error description
     * @param details - Additional error context and metadata
     * @param requestId - Unique identifier for request tracing
     */
    constructor(
        code: APIErrorCode,
        message: string,
        details: Record<string, any> = {},
        requestId: string
    ) {
        // Call parent Error constructor with message
        super(message);

        // Set error properties
        this.code = code;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;

        // Set prototype explicitly for proper instanceof behavior
        // This is required when extending built-in classes in TypeScript
        Object.setPrototypeOf(this, APIError.prototype);

        // Capture stack trace
        Error.captureStackTrace(this, APIError);
    }

    /**
     * Converts the error instance to a plain object for JSON serialization
     * @returns Serializable error object conforming to APIError interface
     */
    public toJSON(): {
        code: APIErrorCode;
        message: string;
        details: Record<string, any>;
        timestamp: string;
        requestId: string;
    } {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            requestId: this.requestId
        };
    }
}
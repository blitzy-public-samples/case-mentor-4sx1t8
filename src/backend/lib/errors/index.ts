/**
 * @fileoverview Central export module for error handling functionality
 * Requirements addressed:
 * - Error Handling (7. SYSTEM DESIGN/7.3 API Design/7.3.5 Error Handling)
 *   Provides standardized error handling with error codes, messages, and details
 * - API Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details/API Layer)
 *   Supports error handling for NextJS Edge Functions with <200ms response time
 * 
 * Human Tasks:
 * 1. Verify error handler integration in all API routes
 * 2. Set up error monitoring and alerting system
 * 3. Configure error logging aggregation
 * 4. Document error codes and handling procedures for team reference
 */

// Re-export error handling components for centralized access
export { APIError } from './APIError';
export {
    handleError,
    handleValidationError,
    handleAuthError,
    handleRateLimitError
} from './handlers';

/**
 * This module serves as the central point for error handling exports,
 * providing a clean interface for importing error handling functionality
 * across the application.
 * 
 * The exported components include:
 * - APIError: Custom error class for standardized error representation
 * - handleError: Global error handler for converting various error types
 * - handleValidationError: Specialized handler for Zod validation errors
 * - handleAuthError: Handler for authentication/authorization errors
 * - handleRateLimitError: Handler for rate limiting errors
 * 
 * These exports support the following error handling requirements:
 * - Standardized error responses with consistent structure
 * - Detailed validation error reporting
 * - Authentication and authorization error handling
 * - Rate limiting error handling with retry information
 * - Request tracing with unique request IDs
 */
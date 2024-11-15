/**
 * Human Tasks:
 * 1. Monitor utility function performance to ensure <200ms response time
 * 2. Set up centralized error tracking for utility functions
 * 3. Review and update security configurations periodically
 * 4. Verify all exported functions are properly documented
 */

/**
 * @fileoverview Central export point for all utility functions used across backend services
 * Requirements addressed:
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 * - Security Architecture (5. SYSTEM ARCHITECTURE/5.4 Cross-Cutting Concerns)
 */

// Encryption utilities
export {
    encrypt,
    decrypt,
    hashPassword,
    verifyPassword,
    generateKey
} from './encryption';

// Formatting utilities
export {
    formatAPIResponse,
    formatDrillResponse,
    formatTimestamp,
    formatScore,
    formatDuration
} from './formatting';

// Validation utilities
export {
    validateDrillAttempt,
    validateSimulationParameters,
    validateUserProfile,
    validateSubscriptionChange
} from './validation';

// Database utilities
export {
    initializePool,
    executeQuery,
    withTransaction,
    buildQuery,
    DatabaseError
} from './database';

/**
 * Re-export types that might be needed by consumers of these utilities
 * Note: Type exports don't affect runtime performance
 */
export type {
    APIResponse,
    APIError,
    DrillResponse,
    SecurityConfig,
    DatabaseConfig,
    QueryOptions,
    QueryFilters
} from '../types';
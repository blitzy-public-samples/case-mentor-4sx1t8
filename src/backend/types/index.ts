/**
 * @fileoverview Central export module that consolidates and re-exports all TypeScript type definitions
 * Requirements addressed:
 * - Type Safety (4. TECHNOLOGY STACK/Programming Languages): TypeScript for strong typing and enhanced IDE support
 * - Code Organization (5. SYSTEM ARCHITECTURE/5.2 Component Details): Centralized type definitions for consistent data structures
 */

// API Types
import {
    HTTPMethod,
    APIErrorCode,
    APIError,
    APIResponse,
    PaginationParams,
    PaginatedResponse,
    RateLimitInfo
} from './api';

// Drill Types
import {
    DrillType,
    DrillDifficulty,
    DrillStatus,
    DrillPrompt,
    DrillAttempt,
    DrillEvaluation,
    DrillResponse
} from './drills';

// Simulation Types
import {
    SpeciesType,
    Species,
    EnvironmentParameters,
    SimulationState,
    SimulationStatus,
    SimulationResult,
    SimulationResponse
} from './simulation';

// User Types
import {
    User,
    UserProfile,
    UserSubscriptionTier,
    UserSubscriptionStatus,
    UserPreparationLevel,
    UserProgress
} from './user';

// Subscription Types
import {
    SubscriptionPlan,
    SubscriptionFeature,
    SubscriptionLimits,
    Subscription,
    SubscriptionUsage
} from './subscription';

// API Types Namespace
export namespace APITypes {
    export {
        HTTPMethod,
        APIErrorCode,
        APIError,
        APIResponse,
        PaginationParams,
        PaginatedResponse,
        RateLimitInfo
    };
}

// Drill Types Namespace
export namespace DrillTypes {
    export {
        DrillType,
        DrillDifficulty,
        DrillStatus,
        DrillPrompt,
        DrillAttempt,
        DrillEvaluation,
        DrillResponse
    };
}

// Simulation Types Namespace
export namespace SimulationTypes {
    export {
        SpeciesType,
        Species,
        EnvironmentParameters,
        SimulationState,
        SimulationStatus,
        SimulationResult,
        SimulationResponse
    };
}

// User Types Namespace
export namespace UserTypes {
    export {
        User,
        UserProfile,
        UserSubscriptionTier,
        UserSubscriptionStatus,
        UserPreparationLevel,
        UserProgress
    };
}

// Subscription Types Namespace
export namespace SubscriptionTypes {
    export {
        SubscriptionPlan,
        SubscriptionFeature,
        SubscriptionLimits,
        Subscription,
        SubscriptionUsage
    };
}
// @ts-check
import { z } from 'zod'; // ^3.22.0

// Human Tasks:
// 1. Ensure database schema matches these type definitions
// 2. Configure proper enum values in environment variables if needed
// 3. Verify subscription tier limits match business requirements

/**
 * @fileoverview Core type definitions for user management system
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 */

/**
 * Available subscription tiers with corresponding access levels
 * Requirement: Tiered access control with Free, Basic, and Premium levels
 */
export enum UserSubscriptionTier {
    FREE = 'FREE',
    BASIC = 'BASIC',
    PREMIUM = 'PREMIUM'
}

/**
 * Subscription payment and activation statuses
 * Requirement: Payment processing integration, account management
 */
export enum UserSubscriptionStatus {
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELED = 'CANCELED',
    EXPIRED = 'EXPIRED'
}

/**
 * User case interview preparation skill levels
 * Requirement: Progress tracking, performance analytics
 */
export enum UserPreparationLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED'
}

/**
 * Interface for user profile information
 * Requirement: Profile customization
 */
export interface UserProfile {
    firstName: string;
    lastName: string;
    targetFirm: string;
    interviewDate: Date | null;
    preparationLevel: UserPreparationLevel;
    avatarUrl: string | null;
}

/**
 * Core user interface representing a registered user
 * Requirement: User Management - Profile customization
 */
export interface User {
    id: string;
    email: string;
    profile: UserProfile;
    subscriptionTier: UserSubscriptionTier;
    subscriptionStatus: UserSubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
}

/**
 * Interface for tracking user progress and performance metrics
 * Requirement: Progress tracking, performance analytics
 */
export interface UserProgress {
    userId: string;
    drillsCompleted: number;
    drillsSuccessRate: number;
    simulationsCompleted: number;
    simulationsSuccessRate: number;
    skillLevels: Record<string, number>;
    lastUpdated: Date;
}

// Zod schemas for runtime validation

export const userProfileSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    targetFirm: z.string().min(1).max(100),
    interviewDate: z.date().nullable(),
    preparationLevel: z.nativeEnum(UserPreparationLevel),
    avatarUrl: z.string().url().nullable()
});

export const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    profile: userProfileSchema,
    subscriptionTier: z.nativeEnum(UserSubscriptionTier),
    subscriptionStatus: z.nativeEnum(UserSubscriptionStatus),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date()
});

export const userProgressSchema = z.object({
    userId: z.string().uuid(),
    drillsCompleted: z.number().int().min(0),
    drillsSuccessRate: z.number().min(0).max(100),
    simulationsCompleted: z.number().int().min(0),
    simulationsSuccessRate: z.number().min(0).max(100),
    skillLevels: z.record(z.string(), z.number().min(0).max(100)),
    lastUpdated: z.date()
});
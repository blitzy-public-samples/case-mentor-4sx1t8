// @ts-check
import { z } from 'zod'; // ^3.22.0

/**
 * Human Tasks:
 * 1. Ensure Supabase database schema matches these type definitions
 * 2. Configure proper date serialization in API responses
 * 3. Set up proper validation rules in the frontend forms
 */

// Requirement: User Management - Profile customization and progress tracking
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

// Requirement: User Management - Profile customization for consulting interview preparation
export interface UserProfile {
  firstName: string;
  lastName: string;
  targetFirm: string;
  interviewDate: Date | null;
  preparationLevel: UserPreparationLevel;
  avatarUrl: string | null;
}

// Requirement: Subscription System - Tiered access control
export enum UserSubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

// Requirement: Subscription System - Payment processing integration and account management
export enum UserSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED'
}

// Requirement: User Management - Progress tracking for skill assessment
export enum UserPreparationLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Requirement: User Management - Performance analytics for consulting interview preparation
export interface UserProgress {
  userId: string;
  drillsCompleted: number;
  drillsSuccessRate: number;
  simulationsCompleted: number;
  simulationsSuccessRate: number;
  skillLevels: Record<string, number>;
  lastUpdated: Date;
}

// Requirement: User Management - Runtime validation for user data structures
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  profile: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    targetFirm: z.string().min(1).max(100),
    interviewDate: z.date().nullable(),
    preparationLevel: z.nativeEnum(UserPreparationLevel),
    avatarUrl: z.string().url().nullable()
  }),
  subscriptionTier: z.nativeEnum(UserSubscriptionTier),
  subscriptionStatus: z.nativeEnum(UserSubscriptionStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date()
});

// Requirement: User Management - API response wrapper with error handling
export interface UserResponse<T> {
  data: T;
  success: boolean;
  error: string | null;
}
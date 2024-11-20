// @ts-check
import { z } from 'zod'; // ^3.22.0
import { APIError, APIErrorCode } from '../types/api';
import { DrillType, DrillDifficulty } from '../types/drills';
import { SpeciesType } from '../types/simulation';
import { UserSubscriptionTier } from '../types/user';

// Human Tasks:
// 1. Configure maximum response length limits in environment variables
// 2. Set up monitoring for validation performance to ensure <200ms processing time
// 3. Configure logging for validation failures to track common issues
// 4. Review and adjust time limit constraints based on user feedback

/**
 * @fileoverview Core validation utility functions using Zod schemas
 * Requirements addressed:
 * - Security Controls (7. SYSTEM DESIGN/7.3 API Design/7.3.6 Security Controls)
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 */

/**
 * Validates a drill attempt submission
 * Requirement: Security Controls - Input validation for API endpoints
 */
export async function validateDrillAttempt(attempt: any): Promise<boolean> {
  const drillAttemptSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    drillId: z.string().uuid(),
    type: z.nativeEnum(DrillType),
    difficulty: z.nativeEnum(DrillDifficulty),
    response: z.string().min(1).max(10000), // Maximum response length
    startedAt: z.date(),
    timeSpent: z.number().min(0).max(3600), // Maximum 1 hour
  });

  try {
    await drillAttemptSchema.parseAsync(attempt);
    
    // Additional validation for time constraints based on drill type
    const timeConstraints: Record<DrillType, number> = {
      [DrillType.CASE_PROMPT]: 1800, // 30 minutes
      [DrillType.CALCULATION]: 900,  // 15 minutes
      [DrillType.CASE_MATH]: 1200,   // 20 minutes
      [DrillType.BRAINSTORMING]: 600, // 10 minutes
      [DrillType.MARKET_SIZING]: 1200, // 20 minutes
      [DrillType.SYNTHESIZING]: 1800  // 30 minutes
    };

    if (attempt.timeSpent > timeConstraints[attempt.type]) {
      throw new Error(`Time limit exceeded for drill type ${attempt.type}`);
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid drill attempt submission',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: attempt
      }
    } as APIError;
  }
}

/**
 * Validates simulation environment parameters
 * Requirement: Security Controls - Input validation for API endpoints
 */
export async function validateSimulationParameters(params: any): Promise<boolean> {
  const environmentSchema = z.object({
    temperature: z.number().min(0).max(50)
      .refine(val => val >= 0 && val <= 50, 'Temperature must be between 0-50°C'),
    depth: z.number().min(0).max(1000)
      .refine(val => val >= 0 && val <= 1000, 'Depth must be between 0-1000m'),
    salinity: z.number().min(0).max(40)
      .refine(val => val >= 0 && val <= 40, 'Salinity must be between 0-40 ppt'),
    lightLevel: z.number().min(0).max(100)
      .refine(val => val >= 0 && val <= 100, 'Light level must be between 0-100%'),
    speciesType: z.nativeEnum(SpeciesType)
  });

  try {
    await environmentSchema.parseAsync(params);
    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid simulation parameters',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: params
      }
    } as APIError;
  }
}

/**
 * Validates user profile data
 * Requirement: Security Controls - Input validation for API endpoints
 */
export async function validateUserProfile(profile: any): Promise<boolean> {
  const userProfileSchema = z.object({
    firstName: z.string().min(1).max(50)
      .regex(/^[a-zA-Z\s-']+$/, 'Name must contain only letters, spaces, hyphens, and apostrophes'),
    lastName: z.string().min(1).max(50)
      .regex(/^[a-zA-Z\s-']+$/, 'Name must contain only letters, spaces, hyphens, and apostrophes'),
    email: z.string().email('Invalid email format'),
    subscriptionTier: z.nativeEnum(UserSubscriptionTier),
    phoneNumber: z.string().optional()
      .refine(val => !val || /^\+?[\d\s-()]+$/.test(val), 'Invalid phone number format'),
    company: z.string().optional().max(100),
    position: z.string().optional().max(100)
  });

  try {
    await userProfileSchema.parseAsync(profile);
    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid user profile data',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: profile
      }
    } as APIError;
  }
}

/**
 * Validates subscription change requests
 * Requirement: Security Controls - Input validation for API endpoints
 */
export async function validateSubscriptionChange(request: any): Promise<boolean> {
  const subscriptionChangeSchema = z.object({
    userId: z.string().uuid(),
    currentTier: z.nativeEnum(UserSubscriptionTier),
    newTier: z.nativeEnum(UserSubscriptionTier),
    paymentDetails: z.object({
      paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
      billingAddress: z.string().min(1),
      paymentToken: z.string().optional()
    }).optional()
  });

  try {
    await subscriptionChangeSchema.parseAsync(request);

    // Validate allowed tier transitions
    const allowedTransitions: Record<UserSubscriptionTier, UserSubscriptionTier[]> = {
      [UserSubscriptionTier.FREE]: [UserSubscriptionTier.BASIC, UserSubscriptionTier.PREMIUM],
      [UserSubscriptionTier.BASIC]: [UserSubscriptionTier.PREMIUM, UserSubscriptionTier.FREE],
      [UserSubscriptionTier.PREMIUM]: [UserSubscriptionTier.BASIC, UserSubscriptionTier.FREE]
    };

    if (!allowedTransitions[request.currentTier].includes(request.newTier)) {
      throw new Error(`Invalid subscription transition from ${request.currentTier} to ${request.newTier}`);
    }

    // Require payment details when upgrading
    if (
      (request.currentTier === UserSubscriptionTier.FREE && request.newTier !== UserSubscriptionTier.FREE) ||
      (request.currentTier === UserSubscriptionTier.BASIC && request.newTier === UserSubscriptionTier.PREMIUM)
    ) {
      if (!request.paymentDetails) {
        throw new Error('Payment details required for subscription upgrade');
      }
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid subscription change request',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: request
      }
    } as APIError;
  }
}
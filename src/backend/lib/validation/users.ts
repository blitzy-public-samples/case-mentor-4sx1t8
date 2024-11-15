// @ts-check
import { z } from 'zod'; // ^3.22.0
import { 
  User, 
  UserProfile, 
  UserSubscriptionTier,
  UserSubscriptionStatus,
  UserPreparationLevel 
} from '../../types/user';
import { validateUserProfile } from '../../utils/validation';
import { AUTH_CONSTANTS } from '../../config/constants';

// Human Tasks:
// 1. Review password complexity requirements with security team
// 2. Configure email validation regex patterns in environment variables
// 3. Set up monitoring for validation function performance
// 4. Verify subscription tier validation rules with business team

/**
 * @fileoverview User data validation schemas and functions
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Security Controls (7. SYSTEM DESIGN/7.3 API Design/7.3.6 Security Controls)
 */

/**
 * Schema for user registration validation
 * Requirement: Security Controls - Input validation for user data
 */
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  profile: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s-']+$/, 'First name must contain only letters, spaces, hyphens, and apostrophes'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s-']+$/, 'Last name must contain only letters, spaces, hyphens, and apostrophes'),
    targetFirm: z.string()
      .min(1, 'Target firm is required')
      .max(100, 'Target firm must not exceed 100 characters'),
    interviewDate: z.date().nullable(),
    preparationLevel: z.nativeEnum(UserPreparationLevel)
  })
});

/**
 * Schema for user profile updates
 * Requirement: User Management - Profile customization
 */
export const userProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'First name must contain only letters, spaces, hyphens, and apostrophes'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Last name must contain only letters, spaces, hyphens, and apostrophes'),
  targetFirm: z.string()
    .min(1, 'Target firm is required')
    .max(100, 'Target firm must not exceed 100 characters'),
  interviewDate: z.date().nullable(),
  preparationLevel: z.nativeEnum(UserPreparationLevel)
}).partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

/**
 * Schema for subscription updates
 * Requirement: User Management - Subscription management
 */
export const subscriptionUpdateSchema = z.object({
  tier: z.nativeEnum(UserSubscriptionTier),
  status: z.nativeEnum(UserSubscriptionStatus),
  paymentInfo: z.object({
    paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
    billingAddress: z.string().min(1),
    cardLastFour: z.string().length(4).optional(),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).optional()
  }).optional().superRefine((data, ctx) => {
    if (data?.paymentMethod === 'CREDIT_CARD' && (!data.cardLastFour || !data.expiryDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card details required for credit card payment method"
      });
    }
  })
});

/**
 * Validates user registration data
 * Requirement: Security Controls - Input validation for user data
 */
export async function validateUserRegistration(registrationData: unknown): Promise<boolean> {
  try {
    await userRegistrationSchema.parseAsync(registrationData);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates profile update data
 * Requirement: User Management - Profile customization
 */
export async function validateProfileUpdate(profileData: unknown): Promise<boolean> {
  try {
    await userProfileSchema.parseAsync(profileData);
    // Additional validation using utility function
    await validateUserProfile(profileData);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Profile validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates subscription update request
 * Requirement: User Management - Subscription management
 */
export async function validateSubscriptionUpdate(subscriptionData: unknown): Promise<boolean> {
  try {
    const validatedData = await subscriptionUpdateSchema.parseAsync(subscriptionData);
    
    // Additional validation for paid tiers
    if (validatedData.tier !== UserSubscriptionTier.FREE && !validatedData.paymentInfo) {
      throw new Error('Payment information required for paid subscription tiers');
    }

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Subscription validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
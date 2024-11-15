/**
 * Human Tasks:
 * 1. Set up database indexes for user progress tracking tables
 * 2. Configure Supabase RLS policies for drill_attempts table
 * 3. Set up monitoring for subscription-related queries
 * 4. Configure webhook endpoints for subscription status changes
 */

// @supabase/postgrest-js ^1.0.0
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { UserProfile, UserProgress, UserSubscription } from '../../../types/user';
import { UserModel } from '../models/user';
import { supabase } from '../../../config/database';
import { validateEmail } from '../../utils/validation';

/**
 * Retrieves a user profile by ID with optimized query
 * Requirement: User Management - Profile customization and progress tracking
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const userModel = new UserModel(supabase);
    const user = await userModel.findById(userId);

    if (!user) {
      return null;
    }

    // Include subscription status with user profile
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    return {
      ...user,
      subscription: subscription || undefined
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

/**
 * Retrieves a user profile by email address
 * Requirement: User Management - Profile access and verification
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const userModel = new UserModel(supabase);
    const user = await userModel.findByEmail(email);

    if (!user) {
      return null;
    }

    // Include subscription status with user profile
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    return {
      ...user,
      subscription: subscription || undefined
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Retrieves detailed user progress including drill completion stats
 * Requirement: User Management - Progress tracking and performance analytics
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const { data: drillAttempts, error } = await supabase
    .from('drill_attempts')
    .select(`
      id,
      drill_type,
      score,
      completed_at,
      duration
    `)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Calculate progress statistics
  const progress: UserProgress = {
    userId,
    totalDrillsCompleted: drillAttempts.length,
    drillTypeProgress: {},
    averageScore: 0,
    strengthAreas: [],
    improvementAreas: [],
    lastActivityAt: new Date()
  };

  // Aggregate drill type statistics
  const drillTypeStats = drillAttempts.reduce((acc, attempt) => {
    if (!acc[attempt.drill_type]) {
      acc[attempt.drill_type] = {
        count: 0,
        totalScore: 0
      };
    }
    acc[attempt.drill_type].count++;
    acc[attempt.drill_type].totalScore += attempt.score;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number }>);

  // Calculate averages and identify strength/improvement areas
  let totalScore = 0;
  Object.entries(drillTypeStats).forEach(([drillType, stats]) => {
    const average = stats.totalScore / stats.count;
    progress.drillTypeProgress[drillType] = average;
    totalScore += stats.totalScore;

    if (average >= 80) {
      progress.strengthAreas.push(drillType);
    } else if (average <= 60) {
      progress.improvementAreas.push(drillType);
    }
  });

  progress.averageScore = totalScore / drillAttempts.length;
  progress.lastActivityAt = drillAttempts[0]?.completed_at || new Date();

  return progress;
}

/**
 * Updates user profile information with validation
 * Requirement: User Management - Profile customization
 * Requirement: Data Security - Handle confidential user data
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  // Filter out protected fields
  const safeUpdates = { ...updates };
  delete safeUpdates.id;
  delete safeUpdates.email;
  delete safeUpdates.role;
  delete safeUpdates.status;
  delete safeUpdates.createdAt;

  try {
    const userModel = new UserModel(supabase);
    const updatedProfile = await userModel.update(userId, safeUpdates);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Updates user subscription status and tier
 * Requirement: Subscription System - Support tiered access control
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: UserSubscription
): Promise<void> {
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .upsert({
      userId,
      ...subscriptionData,
      updatedAt: new Date()
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

  // Update user role based on subscription tier
  const roleMap: Record<string, string> = {
    FREE: 'FREE_USER',
    BASIC: 'PAID_USER',
    PREMIUM: 'PAID_USER'
  };

  const userModel = new UserModel(supabase);
  await userModel.update(userId, {
    role: roleMap[subscriptionData.tier]
  });

  // Trigger subscription webhook
  await supabase.rpc('trigger_subscription_webhook', {
    user_id: userId,
    subscription_data: subscriptionData
  });
}

/**
 * Soft deletes user account and handles cleanup
 * Requirement: Data Security - Data Classification
 */
export async function deactivateUser(userId: string): Promise<void> {
  try {
    // Update user status to DELETED
    const userModel = new UserModel(supabase);
    await userModel.update(userId, { status: 'DELETED' });

    // Cancel active subscriptions
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'CANCELLED',
        endDate: new Date(),
        autoRenew: false
      })
      .eq('userId', userId);

    if (subscriptionError) {
      throw subscriptionError;
    }

    // Archive user data
    await supabase.rpc('archive_user_data', { user_id: userId });

    // Trigger cleanup workflows
    await supabase.rpc('trigger_user_cleanup_workflow', { user_id: userId });
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}
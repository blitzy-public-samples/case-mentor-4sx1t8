// @ts-check

// Human Tasks:
// 1. Configure Supabase database tables and policies for user data
// 2. Set up proper indexes for email and subscription queries
// 3. Verify password hashing configuration meets security requirements
// 4. Configure subscription tier limits in environment variables

import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { 
    User, 
    UserProfile, 
    UserSubscriptionTier, 
    UserSubscriptionStatus 
} from '../types/user';
import { validateUserProfile } from '../utils/validation';
import { hashPassword, verifyPassword } from '../utils/encryption';
import { supabaseClient } from '../config/database';

/**
 * Core User model class for managing user data and operations
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.2 Data Security)
 */
export class UserModel {
    private dbClient: typeof supabaseClient;

    constructor() {
        // Initialize database client from imported configuration
        this.dbClient = supabaseClient;
    }

    /**
     * Creates a new user with profile and encrypted credentials
     * @requirement User Management - Profile customization
     * @requirement Data Security - Secure handling of user credentials
     */
    async createUser(userData: { 
        email: string; 
        password: string; 
        profile: UserProfile 
    }): Promise<User> {
        // Validate user profile data
        await validateUserProfile(userData.profile);

        // Hash password using secure encryption
        const { hash, salt } = hashPassword(userData.password);

        // Create user record with encrypted credentials
        const { data: user, error } = await this.dbClient
            .from('users')
            .insert({
                email: userData.email,
                password_hash: hash,
                password_salt: salt,
                profile: userData.profile,
                subscription_tier: UserSubscriptionTier.FREE,
                subscription_status: UserSubscriptionStatus.ACTIVE,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }

        // Return created user object
        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date(user.last_login_at)
        };
    }

    /**
     * Retrieves a user by their ID
     * @requirement User Management - Profile management
     */
    async getUserById(userId: string): Promise<User | null> {
        const { data: user, error } = await this.dbClient
            .from('users')
            .select()
            .eq('id', userId)
            .single();

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date(user.last_login_at)
        };
    }

    /**
     * Updates a user's profile information
     * @requirement User Management - Profile customization
     */
    async updateUserProfile(userId: string, profileData: UserProfile): Promise<User> {
        // Validate updated profile data
        await validateUserProfile(profileData);

        // Update user record
        const { data: user, error } = await this.dbClient
            .from('users')
            .update({
                profile: profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update user profile: ${error.message}`);
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date(user.last_login_at)
        };
    }

    /**
     * Authenticates a user with email and password
     * @requirement Data Security - Secure authentication
     */
    async authenticateUser(email: string, password: string): Promise<User | null> {
        // Retrieve user by email
        const { data: user, error } = await this.dbClient
            .from('users')
            .select()
            .eq('email', email)
            .single();

        if (error || !user) {
            return null;
        }

        // Verify password using secure comparison
        const isValid = verifyPassword(password, user.password_hash, user.password_salt);
        if (!isValid) {
            return null;
        }

        // Update last login timestamp
        await this.dbClient
            .from('users')
            .update({
                last_login_at: new Date().toISOString()
            })
            .eq('id', user.id);

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date(user.last_login_at)
        };
    }

    /**
     * Updates a user's subscription tier and status
     * @requirement Subscription System - Tiered access control
     */
    async updateSubscription(userId: string, subscriptionData: {
        tier: UserSubscriptionTier;
        status: UserSubscriptionStatus;
    }): Promise<User> {
        // Update subscription details
        const { data: user, error } = await this.dbClient
            .from('users')
            .update({
                subscription_tier: subscriptionData.tier,
                subscription_status: subscriptionData.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update subscription: ${error.message}`);
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date(user.last_login_at)
        };
    }
}
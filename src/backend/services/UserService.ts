// Human Tasks:
// 1. Configure Stripe webhook endpoints for subscription events
// 2. Set up monitoring for user authentication attempts
// 3. Configure rate limiting for authentication endpoints
// 4. Verify password hashing configuration meets security standards
// 5. Set up error tracking for failed transactions

import { 
    UserModel, 
    createUser, 
    getUserById, 
    updateUserProfile, 
    authenticateUser, 
    updateSubscription 
} from '../models/User';
import { 
    SubscriptionModel,
    findByUserId,
    create as createSubscription,
    update as updateSubscriptionDetails,
    checkUsage 
} from '../models/Subscription';
import { executeQuery, withTransaction } from '../utils/database';
import { validateUserProfile } from '../utils/validation';

/**
 * Service class for handling user-related business logic and operations
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.2 Data Security)
 */
export class UserService {
    private userModel: UserModel;
    private subscriptionModel: SubscriptionModel;

    constructor() {
        this.userModel = new UserModel();
        this.subscriptionModel = new SubscriptionModel({} as any); // Initialized with empty data
    }

    /**
     * Registers a new user with profile and subscription within a transaction
     * @requirement User Management - Profile customization
     * @requirement Data Security - Secure handling of user data
     */
    async registerUser(registrationData: { 
        email: string; 
        password: string; 
        profile: UserProfile 
    }): Promise<User> {
        // Validate user profile data
        await validateUserProfile(registrationData.profile);

        return await withTransaction(async () => {
            // Create user with profile
            const user = await this.userModel.createUser({
                email: registrationData.email,
                password: registrationData.password,
                profile: registrationData.profile
            });

            // Create default subscription
            await createSubscription({
                id: crypto.randomUUID(),
                userId: user.id,
                planId: 'free_tier',
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                cancelAtPeriodEnd: false,
                stripeSubscriptionId: '',
                stripeCustomerId: ''
            });

            return user;
        });
    }

    /**
     * Authenticates user credentials and returns user data with subscription
     * @requirement Data Security - Secure authentication
     */
    async authenticateUser(email: string, password: string): Promise<User | null> {
        // Authenticate user
        const user = await this.userModel.authenticateUser(email, password);
        if (!user) {
            return null;
        }

        // Load active subscription
        const subscription = await findByUserId(user.id);
        if (subscription) {
            user.subscription = subscription;
        }

        return user;
    }

    /**
     * Updates user profile information with validation
     * @requirement User Management - Profile customization
     */
    async updateProfile(userId: string, profileData: UserProfile): Promise<User> {
        // Validate profile data
        await validateUserProfile(profileData);

        // Update user profile
        const updatedUser = await this.userModel.updateUserProfile(userId, profileData);
        
        // Load active subscription
        const subscription = await findByUserId(userId);
        if (subscription) {
            updatedUser.subscription = subscription;
        }

        return updatedUser;
    }

    /**
     * Retrieves user's practice progress and analytics with subscription validation
     * @requirement User Management - Progress tracking, performance analytics
     */
    async getUserProgress(userId: string): Promise<UserProgress> {
        // Verify user exists
        const user = await this.userModel.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check subscription usage limits
        const subscription = await findByUserId(userId);
        if (!subscription) {
            throw new Error('No active subscription found');
        }

        const hasAccess = await checkUsage('progress_tracking');
        if (!hasAccess) {
            throw new Error('Usage limit exceeded for progress tracking');
        }

        // Query drill attempts and calculate progress metrics
        const drillAttempts = await executeQuery(`
            SELECT 
                drill_type,
                difficulty,
                score,
                completed_at
            FROM drill_attempts
            WHERE user_id = $1
            AND completed_at > NOW() - INTERVAL '30 days'
            ORDER BY completed_at DESC
        `, [userId]);

        // Calculate progress metrics
        const progress: UserProgress = {
            totalAttempts: drillAttempts.length,
            averageScore: drillAttempts.reduce((acc, curr) => acc + curr.score, 0) / drillAttempts.length,
            completionsByType: drillAttempts.reduce((acc, curr) => {
                acc[curr.drill_type] = (acc[curr.drill_type] || 0) + 1;
                return acc;
            }, {}),
            difficultyDistribution: drillAttempts.reduce((acc, curr) => {
                acc[curr.difficulty] = (acc[curr.difficulty] || 0) + 1;
                return acc;
            }, {}),
            recentActivity: drillAttempts.slice(0, 10)
        };

        return progress;
    }

    /**
     * Updates user's subscription tier with transaction management
     * @requirement Subscription System - Tiered access control
     */
    async updateSubscription(userId: string, subscriptionData: { 
        tier: UserSubscriptionTier; 
        status: UserSubscriptionStatus 
    }): Promise<Subscription> {
        return await withTransaction(async () => {
            // Update user subscription tier
            await this.userModel.updateSubscription(userId, subscriptionData);

            // Update subscription details
            const subscription = await findByUserId(userId);
            if (!subscription) {
                throw new Error('No active subscription found');
            }

            return await updateSubscriptionDetails(subscription.id, {
                status: subscriptionData.status,
                updatedAt: new Date()
            });
        });
    }
}
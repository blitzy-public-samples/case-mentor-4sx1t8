// Human Tasks:
// 1. Configure test database with appropriate test data
// 2. Set up test environment variables for subscription tiers
// 3. Configure mock Stripe test keys for subscription testing
// 4. Ensure test coverage meets minimum threshold (>90%)

import { describe, test, expect, beforeEach, jest } from '@jest/globals'; // ^29.0.0
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'; // ^3.0.0
import { UserService } from '../../services/UserService';
import { 
    User,
    UserSubscriptionTier,
    UserSubscriptionStatus,
    UserPreparationLevel
} from '../../types/user';

/**
 * Test suite for UserService class
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.2 Data Security)
 */
describe('UserService', () => {
    let userService: UserService;
    let mockUserModel: DeepMockProxy<any>;
    let mockSubscriptionModel: DeepMockProxy<any>;

    const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            targetFirm: 'Test Consulting',
            interviewDate: new Date('2024-06-01'),
            preparationLevel: UserPreparationLevel.INTERMEDIATE,
            avatarUrl: null
        },
        subscriptionTier: UserSubscriptionTier.FREE,
        subscriptionStatus: UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserModel = mockDeep<any>();
        mockSubscriptionModel = mockDeep<any>();
        userService = new UserService();
        (userService as any).userModel = mockUserModel;
        (userService as any).subscriptionModel = mockSubscriptionModel;
    });

    describe('registerUser', () => {
        test('should successfully register a new user with FREE tier subscription', async () => {
            // Requirement: User Management - Profile customization
            const registrationData = {
                email: 'new@example.com',
                password: 'SecurePass123!',
                profile: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    targetFirm: 'Strategy Co',
                    interviewDate: new Date('2024-07-01'),
                    preparationLevel: UserPreparationLevel.BEGINNER,
                    avatarUrl: null
                }
            };

            mockUserModel.createUser.mockResolvedValue({ ...mockUser, ...registrationData });
            mockSubscriptionModel.create.mockResolvedValue({
                id: 'sub_123',
                userId: mockUser.id,
                tier: UserSubscriptionTier.FREE,
                status: UserSubscriptionStatus.ACTIVE
            });

            const result = await userService.registerUser(registrationData);

            expect(result).toBeDefined();
            expect(result.email).toBe(registrationData.email);
            expect(mockUserModel.createUser).toHaveBeenCalledWith(registrationData);
            expect(mockSubscriptionModel.create).toHaveBeenCalled();
        });

        test('should throw error on profile validation failure', async () => {
            // Requirement: Data Security - Secure handling of user data
            const invalidData = {
                email: 'invalid-email',
                password: '123',
                profile: {
                    firstName: '',
                    lastName: '',
                    targetFirm: '',
                    interviewDate: null,
                    preparationLevel: UserPreparationLevel.BEGINNER,
                    avatarUrl: null
                }
            };

            await expect(userService.registerUser(invalidData))
                .rejects
                .toThrow();
        });
    });

    describe('authenticateUser', () => {
        test('should successfully authenticate user with valid credentials', async () => {
            // Requirement: Data Security - Secure authentication
            const credentials = {
                email: mockUser.email,
                password: 'ValidPass123!'
            };

            mockUserModel.authenticateUser.mockResolvedValue(mockUser);
            mockSubscriptionModel.findByUserId.mockResolvedValue({
                id: 'sub_123',
                status: UserSubscriptionStatus.ACTIVE
            });

            const result = await userService.authenticateUser(credentials.email, credentials.password);

            expect(result).toBeDefined();
            expect(result?.email).toBe(mockUser.email);
            expect(mockUserModel.authenticateUser).toHaveBeenCalledWith(
                credentials.email,
                credentials.password
            );
        });

        test('should return null for invalid credentials', async () => {
            mockUserModel.authenticateUser.mockResolvedValue(null);

            const result = await userService.authenticateUser('wrong@email.com', 'wrongpass');

            expect(result).toBeNull();
        });
    });

    describe('updateProfile', () => {
        test('should successfully update user profile', async () => {
            // Requirement: User Management - Profile customization
            const updatedProfile = {
                ...mockUser.profile,
                targetFirm: 'New Consulting Firm',
                preparationLevel: UserPreparationLevel.ADVANCED
            };

            mockUserModel.updateUserProfile.mockResolvedValue({
                ...mockUser,
                profile: updatedProfile
            });

            const result = await userService.updateProfile(mockUser.id, updatedProfile);

            expect(result.profile.targetFirm).toBe(updatedProfile.targetFirm);
            expect(result.profile.preparationLevel).toBe(updatedProfile.preparationLevel);
            expect(mockUserModel.updateUserProfile).toHaveBeenCalledWith(mockUser.id, updatedProfile);
        });

        test('should throw error for non-existent user', async () => {
            mockUserModel.updateUserProfile.mockRejectedValue(new Error('User not found'));

            await expect(userService.updateProfile('invalid-id', mockUser.profile))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('getUserProgress', () => {
        test('should retrieve user progress with valid subscription', async () => {
            // Requirement: User Management - Progress tracking, performance analytics
            const mockProgress = {
                totalAttempts: 10,
                averageScore: 85,
                completionsByType: { case: 5, math: 5 },
                difficultyDistribution: { easy: 3, medium: 4, hard: 3 },
                recentActivity: []
            };

            mockUserModel.getUserById.mockResolvedValue(mockUser);
            mockSubscriptionModel.findByUserId.mockResolvedValue({
                id: 'sub_123',
                status: UserSubscriptionStatus.ACTIVE
            });
            mockSubscriptionModel.checkUsage.mockResolvedValue(true);

            const result = await userService.getUserProgress(mockUser.id);

            expect(result).toBeDefined();
            expect(mockUserModel.getUserById).toHaveBeenCalledWith(mockUser.id);
            expect(mockSubscriptionModel.checkUsage).toHaveBeenCalledWith('progress_tracking');
        });

        test('should throw error when usage limit exceeded', async () => {
            mockUserModel.getUserById.mockResolvedValue(mockUser);
            mockSubscriptionModel.findByUserId.mockResolvedValue({
                id: 'sub_123',
                status: UserSubscriptionStatus.ACTIVE
            });
            mockSubscriptionModel.checkUsage.mockResolvedValue(false);

            await expect(userService.getUserProgress(mockUser.id))
                .rejects
                .toThrow('Usage limit exceeded for progress tracking');
        });
    });

    describe('updateSubscription', () => {
        test('should successfully update subscription tier', async () => {
            // Requirement: Subscription System - Tiered access control
            const subscriptionUpdate = {
                tier: UserSubscriptionTier.PREMIUM,
                status: UserSubscriptionStatus.ACTIVE
            };

            mockUserModel.updateSubscription.mockResolvedValue({
                ...mockUser,
                subscriptionTier: subscriptionUpdate.tier,
                subscriptionStatus: subscriptionUpdate.status
            });

            mockSubscriptionModel.findByUserId.mockResolvedValue({
                id: 'sub_123',
                userId: mockUser.id
            });

            mockSubscriptionModel.updateSubscriptionDetails.mockResolvedValue({
                id: 'sub_123',
                userId: mockUser.id,
                tier: subscriptionUpdate.tier,
                status: subscriptionUpdate.status
            });

            const result = await userService.updateSubscription(mockUser.id, subscriptionUpdate);

            expect(result).toBeDefined();
            expect(result.tier).toBe(subscriptionUpdate.tier);
            expect(result.status).toBe(subscriptionUpdate.status);
            expect(mockUserModel.updateSubscription).toHaveBeenCalledWith(
                mockUser.id,
                subscriptionUpdate
            );
        });

        test('should throw error for invalid subscription update', async () => {
            mockUserModel.updateSubscription.mockRejectedValue(
                new Error('Invalid subscription update')
            );

            await expect(userService.updateSubscription(mockUser.id, {
                tier: UserSubscriptionTier.PREMIUM,
                status: UserSubscriptionStatus.ACTIVE
            })).rejects.toThrow('Invalid subscription update');
        });
    });
});
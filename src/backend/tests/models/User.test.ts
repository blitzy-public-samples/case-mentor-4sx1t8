// Human Tasks:
// 1. Verify test database configuration is properly isolated from production
// 2. Ensure test data cleanup procedures are working correctly
// 3. Configure test timeouts appropriately for CI/CD pipeline
// 4. Verify mock data matches production schema requirements

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.0.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { UserModel } from '../../models/User';
import { User, UserSubscriptionTier, UserSubscriptionStatus, UserPreparationLevel } from '../../types/user';
import { supabaseClient } from '../../config/database';

// Mock the database client
jest.mock('../../config/database', () => ({
    supabaseClient: {
        from: jest.fn(),
    },
}));

describe('UserModel', () => {
    let userModel: UserModel;
    let mockUser: User;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Initialize UserModel instance
        userModel = new UserModel();

        // Setup mock user data
        mockUser = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            profile: {
                firstName: 'Test',
                lastName: 'User',
                targetFirm: 'Test Consulting',
                interviewDate: new Date('2024-01-01'),
                preparationLevel: UserPreparationLevel.INTERMEDIATE,
                avatarUrl: null
            },
            subscriptionTier: UserSubscriptionTier.FREE,
            subscriptionStatus: UserSubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date()
        };
    });

    afterEach(() => {
        // Clean up after each test
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a new user with valid email, password and profile data', async () => {
            // Mock successful user creation
            const mockFrom = jest.fn().mockReturnThis();
            const mockInsert = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                insert: mockInsert,
                select: mockSelect,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.createUser({
                email: 'test@example.com',
                password: 'securePassword123',
                profile: mockUser.profile
            });

            expect(result).toEqual(mockUser);
            expect(mockInsert).toHaveBeenCalled();
        });

        it('should throw error for invalid email format', async () => {
            await expect(userModel.createUser({
                email: 'invalid-email',
                password: 'password123',
                profile: mockUser.profile
            })).rejects.toThrow();
        });

        it('should initialize with FREE subscription tier', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockInsert = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                insert: mockInsert,
                select: mockSelect,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.createUser({
                email: 'test@example.com',
                password: 'password123',
                profile: mockUser.profile
            });

            expect(result.subscriptionTier).toBe(UserSubscriptionTier.FREE);
        });
    });

    describe('getUserById', () => {
        it('should return complete user object when found', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.getUserById(mockUser.id);
            expect(result).toEqual(mockUser);
        });

        it('should return null when user ID does not exist', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.getUserById('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile with valid profile data', async () => {
            const updatedProfile = {
                ...mockUser.profile,
                firstName: 'Updated',
                lastName: 'Name'
            };

            const mockFrom = jest.fn().mockReturnThis();
            const mockUpdate = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ 
                data: { ...mockUser, profile: updatedProfile },
                error: null 
            });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                update: mockUpdate,
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.updateUserProfile(mockUser.id, updatedProfile);
            expect(result.profile).toEqual(updatedProfile);
        });

        it('should maintain existing subscription data', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockUpdate = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                update: mockUpdate,
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.updateUserProfile(mockUser.id, mockUser.profile);
            expect(result.subscriptionTier).toBe(mockUser.subscriptionTier);
            expect(result.subscriptionStatus).toBe(mockUser.subscriptionStatus);
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate user with correct email and password', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom,
                update: jest.fn().mockReturnThis()
            }));

            const result = await userModel.authenticateUser('test@example.com', 'correctPassword');
            expect(result).toEqual(mockUser);
        });

        it('should reject non-existent email', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.authenticateUser('nonexistent@example.com', 'password');
            expect(result).toBeNull();
        });
    });

    describe('updateSubscription', () => {
        it('should update subscription tier between FREE, BASIC, PREMIUM', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockUpdate = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ 
                data: { 
                    ...mockUser, 
                    subscriptionTier: UserSubscriptionTier.PREMIUM 
                }, 
                error: null 
            });

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                update: mockUpdate,
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            const result = await userModel.updateSubscription(mockUser.id, {
                tier: UserSubscriptionTier.PREMIUM,
                status: UserSubscriptionStatus.ACTIVE
            });

            expect(result.subscriptionTier).toBe(UserSubscriptionTier.PREMIUM);
        });

        it('should throw error for invalid subscription tier', async () => {
            const mockFrom = jest.fn().mockReturnThis();
            const mockUpdate = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockRejectedValue(new Error('Invalid subscription tier'));

            (supabaseClient.from as jest.Mock).mockImplementation(() => ({
                update: mockUpdate,
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
                from: mockFrom
            }));

            await expect(userModel.updateSubscription(mockUser.id, {
                tier: 'INVALID' as UserSubscriptionTier,
                status: UserSubscriptionStatus.ACTIVE
            })).rejects.toThrow();
        });
    });
});
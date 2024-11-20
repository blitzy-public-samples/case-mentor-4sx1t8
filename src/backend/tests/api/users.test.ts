// Human Tasks:
// 1. Configure test environment variables for authentication tokens
// 2. Set up test database with required user data
// 3. Configure mock Stripe webhook endpoints for subscription testing
// 4. Verify rate limiting configuration matches production

// @ts-check
import { describe, it, expect, beforeEach, jest } from 'jest'; // ^29.0.0
import { User, UserProfile, UserSubscriptionTier, UserSubscriptionStatus } from '../../types/user';
import { UserService } from '../../services/UserService';
import { GET, POST, PUT } from '../../api/users/route';

/**
 * Mock UserService implementation
 * Requirement: User Management - Profile customization, progress tracking
 */
jest.mock('../../services/UserService');

/**
 * Helper function to create mock NextJS request objects
 * @param options Request configuration options
 */
const createMockRequest = (options: { 
    method: string; 
    headers?: Record<string, string>; 
    body?: any;
    cookies?: Record<string, string>;
}): Request => {
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options.headers
    });

    const request = new Request('http://localhost:3000/api/users', {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    // Mock cookies method
    Object.defineProperty(request, 'cookies', {
        get: () => new Map(Object.entries(options.cookies || {}))
    });

    return request;
};

describe('User API Endpoints', () => {
    const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            targetFirm: 'McKinsey',
            interviewDate: new Date('2024-03-01'),
            preparationLevel: 'INTERMEDIATE',
            avatarUrl: null
        },
        subscriptionTier: UserSubscriptionTier.BASIC,
        subscriptionStatus: UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset UserService mock implementations
        (UserService as jest.MockedClass<typeof UserService>).mockImplementation(() => ({
            registerUser: jest.fn().mockResolvedValue(mockUser),
            authenticateUser: jest.fn().mockResolvedValue(mockUser),
            updateProfile: jest.fn().mockResolvedValue(mockUser),
            getUserProgress: jest.fn().mockResolvedValue({
                userId: mockUser.id,
                drillsCompleted: 10,
                drillsSuccessRate: 85,
                simulationsCompleted: 5,
                simulationsSuccessRate: 90,
                skillLevels: {
                    'market-sizing': 80,
                    'case-math': 85,
                    'framework': 75
                },
                lastUpdated: new Date()
            })
        }));
    });

    describe('GET /api/users', () => {
        /**
         * Test successful profile retrieval
         * Requirement: User Management - Progress tracking, performance analytics
         */
        it('should return user profile and progress when authenticated with valid token', async () => {
            const request = createMockRequest({
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer valid_token'
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await GET(request, context);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('drillsCompleted');
            expect(data.data).toHaveProperty('skillLevels');
        });

        /**
         * Test unauthorized access
         * Requirement: User Management - Access control
         */
        it('should return 401 when authentication token is missing or invalid', async () => {
            const request = createMockRequest({
                method: 'GET'
            });

            const response = await GET(request, {});
            expect(response.status).toBe(401);
        });

        /**
         * Test subscription access control
         * Requirement: Subscription System - Tiered access control
         */
        it("should return 403 when subscription tier doesn't allow access", async () => {
            const userService = new UserService();
            (userService.getUserProgress as jest.Mock).mockRejectedValue(
                new Error('Usage limit exceeded for progress tracking')
            );

            const request = createMockRequest({
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer valid_token'
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await GET(request, context);
            expect(response.status).toBe(403);
        });

        /**
         * Test error handling
         * Requirement: User Management - Error handling
         */
        it('should return 500 on UserService error', async () => {
            const userService = new UserService();
            (userService.getUserProgress as jest.Mock).mockRejectedValue(
                new Error('Database connection failed')
            );

            const request = createMockRequest({
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer valid_token'
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await GET(request, context);
            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/users', () => {
        /**
         * Test successful user registration
         * Requirement: User Management - Profile customization
         */
        it('should create new user with valid registration data', async () => {
            const registrationData = {
                email: 'new@example.com',
                password: 'SecurePass123!',
                profile: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    targetFirm: 'Bain',
                    interviewDate: '2024-04-01',
                    preparationLevel: 'BEGINNER'
                }
            };

            const request = createMockRequest({
                method: 'POST',
                body: registrationData
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('id');
            expect(data.data).toHaveProperty('email', registrationData.email);
        });

        /**
         * Test invalid registration data
         * Requirement: User Management - Data validation
         */
        it('should return 400 with invalid or missing registration fields', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123', // Too short
                profile: {
                    firstName: '' // Empty name
                }
            };

            const request = createMockRequest({
                method: 'POST',
                body: invalidData
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        /**
         * Test duplicate email handling
         * Requirement: User Management - User uniqueness
         */
        it('should return 409 if email already exists', async () => {
            const userService = new UserService();
            (userService.registerUser as jest.Mock).mockRejectedValue(
                new Error('Email already exists')
            );

            const request = createMockRequest({
                method: 'POST',
                body: {
                    email: 'existing@example.com',
                    password: 'SecurePass123!',
                    profile: {
                        firstName: 'Test',
                        lastName: 'User',
                        targetFirm: 'BCG'
                    }
                }
            });

            const response = await POST(request);
            expect(response.status).toBe(409);
        });

        /**
         * Test registration error handling
         * Requirement: User Management - Error handling
         */
        it('should return 500 on UserService registration error', async () => {
            const userService = new UserService();
            (userService.registerUser as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const request = createMockRequest({
                method: 'POST',
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    profile: {
                        firstName: 'Test',
                        lastName: 'User',
                        targetFirm: 'BCG'
                    }
                }
            });

            const response = await POST(request);
            expect(response.status).toBe(500);
        });
    });

    describe('PUT /api/users', () => {
        /**
         * Test successful profile update
         * Requirement: User Management - Profile customization
         */
        it('should update user profile with valid profile data when authenticated', async () => {
            const profileUpdate: UserProfile = {
                firstName: 'Updated',
                lastName: 'Name',
                targetFirm: 'Deloitte',
                interviewDate: new Date('2024-05-01'),
                preparationLevel: 'ADVANCED',
                avatarUrl: 'https://example.com/avatar.jpg'
            };

            const request = createMockRequest({
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer valid_token'
                },
                body: profileUpdate
            });

            const context = { user: { id: mockUser.id } };
            const response = await PUT(request, context);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.profile).toMatchObject(profileUpdate);
        });

        /**
         * Test unauthorized profile update
         * Requirement: User Management - Access control
         */
        it('should return 401 when authentication token is missing or invalid', async () => {
            const request = createMockRequest({
                method: 'PUT',
                body: {
                    firstName: 'Test',
                    lastName: 'User'
                }
            });

            const response = await PUT(request, {});
            expect(response.status).toBe(401);
        });

        /**
         * Test invalid profile data
         * Requirement: User Management - Data validation
         */
        it('should return 400 with invalid profile update data', async () => {
            const request = createMockRequest({
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer valid_token'
                },
                body: {
                    firstName: '', // Empty name
                    lastName: 'A'.repeat(51) // Too long
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await PUT(request, context);
            expect(response.status).toBe(400);
        });

        /**
         * Test subscription-based update restrictions
         * Requirement: Subscription System - Tiered access control
         */
        it("should return 403 when subscription tier doesn't allow updates", async () => {
            const userService = new UserService();
            (userService.updateProfile as jest.Mock).mockRejectedValue(
                new Error('Subscription tier does not allow profile updates')
            );

            const request = createMockRequest({
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer valid_token'
                },
                body: {
                    firstName: 'Test',
                    lastName: 'User'
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await PUT(request, context);
            expect(response.status).toBe(403);
        });

        /**
         * Test update error handling
         * Requirement: User Management - Error handling
         */
        it('should return 500 on UserService update error', async () => {
            const userService = new UserService();
            (userService.updateProfile as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const request = createMockRequest({
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer valid_token'
                },
                body: {
                    firstName: 'Test',
                    lastName: 'User'
                }
            });

            const context = { user: { id: mockUser.id } };
            const response = await PUT(request, context);
            expect(response.status).toBe(500);
        });
    });
});
/**
 * Human Tasks:
 * 1. Configure test database connection string in environment variables
 * 2. Set up test data cleanup schedule
 * 3. Configure test JWT keys and certificates
 * 4. Set up test monitoring and logging
 */

// External dependencies
import { describe, it, expect, beforeEach, afterEach } from 'jest'; // ^29.0.0
import { createMocks } from 'node-mocks-http'; // ^1.12.0

// Internal dependencies
import { POST as loginHandler } from '../../api/auth/login';
import { POST as registerHandler } from '../../api/auth/register';
import { AuthResponse, AuthErrorCode } from '../../types/auth';

// Test constants
const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "Test123!@#";

/**
 * Helper function to create a test user for authentication tests
 * Requirement: User Management - Test user account creation
 */
async function createTestUser(overrides = {}): Promise<UserProfile> {
  const { req, res } = createMocks({
    method: 'POST',
    body: {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      firstName: 'Test',
      lastName: 'User',
      ...overrides
    }
  });

  const response = await registerHandler(req);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Failed to create test user');
  }

  return data.data.user;
}

/**
 * Helper function to cleanup test user after tests
 * Requirement: Data Security - Proper test data cleanup
 */
async function cleanupTestUser(email: string): Promise<void> {
  const { db } = global as any;
  await db.collection('users').deleteOne({ email });
  await db.collection('sessions').deleteMany({ email });
}

/**
 * Authentication API Test Suite
 * Requirements addressed:
 * - Authentication Flow (8.1.1): JWT-based authentication testing
 * - Session Management (8.1.3): Token validation and refresh flows
 * - User Management: Account creation and validation
 */
describe('Authentication API', () => {
  let testUser: UserProfile;

  beforeEach(async () => {
    await cleanupTestUser(TEST_USER_EMAIL);
  });

  afterEach(async () => {
    await cleanupTestUser(TEST_USER_EMAIL);
  });

  describe('Registration Endpoint', () => {
    it('should successfully register a new user', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const response = await registerHandler(req);
      const data = await response.json() as AuthResponse;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.expiresIn).toBe(24 * 60 * 60);
      expect(data.data.user.email).toBe(TEST_USER_EMAIL);
    });

    it('should reject duplicate email registration', async () => {
      await createTestUser();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        }
      });

      const response = await registerHandler(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });

    it('should validate password requirements', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: 'weak'
        }
      });

      const response = await registerHandler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Login Endpoint', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should successfully authenticate with valid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        }
      });

      const response = await loginHandler(req);
      const data = await response.json() as AuthResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.expiresIn).toBe(24 * 60 * 60);
      expect(data.data.state).toBe('authenticated');
    });

    it('should reject invalid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: 'wrongpassword'
        }
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    });

    it('should handle rate limiting', async () => {
      const attempts = Array(61).fill(null);
      
      for (const _ of attempts) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email: TEST_USER_EMAIL,
            password: 'wrongpassword'
          }
        });

        const response = await loginHandler(req);
        if (response.status === 429) {
          expect(response.headers.get('Retry-After')).toBeDefined();
          break;
        }
      }
    });

    it('should include proper security headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        }
      });

      const response = await loginHandler(req);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Token Management', () => {
    it('should issue tokens with correct expiration', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        }
      });

      const response = await loginHandler(req);
      const data = await response.json() as AuthResponse;

      const tokenParts = data.token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

      const expectedExpiration = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      expect(payload.exp).toBeCloseTo(expectedExpiration, -2);
    });

    it('should handle remember me functionality', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          rememberMe: true
        }
      });

      const response = await loginHandler(req);
      const data = await response.json() as AuthResponse;

      expect(data.refreshToken).toBeDefined();
      expect(data.data.refreshStrategy).toBe('expiringSoon');
    });
  });
});
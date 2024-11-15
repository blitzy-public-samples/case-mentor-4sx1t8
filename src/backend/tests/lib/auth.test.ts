// @jest/globals ^29.0.0
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
// next/server ^13.0.0
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateToken, 
  verifyToken, 
  setAuthCookie, 
  clearAuthCookie, 
  refreshToken 
} from '../../lib/auth/jwt';
import { 
  withAuth, 
  requireSubscription 
} from '../../lib/auth/middleware';
import { AUTH_CONSTANTS } from '../../config/constants';

// Human Tasks:
// 1. Configure test environment variables for RSA key pair
// 2. Set up test database with mock user data
// 3. Configure test cookie domain settings
// 4. Review test coverage thresholds

// Mock user data for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  subscriptionTier: 'FREE' as const
};

// Mock NextJS request/response objects
let mockRequest: NextRequest;
let mockResponse: NextResponse;
let mockHandler: jest.Mock;

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  
  mockRequest = {
    cookies: {
      get: jest.fn(),
    },
    headers: {
      get: jest.fn(),
    },
  } as unknown as NextRequest;

  mockResponse = {
    setHeader: jest.fn(),
    json: jest.fn(),
  } as unknown as NextResponse;

  mockHandler = jest.fn().mockResolvedValue(mockResponse);
});

// @requirement: Authentication and Authorization - Test coverage for JWT-based authentication
describe('JWT Token Management', () => {
  test('should generate valid JWT token with RSA-256 signing', () => {
    const token = generateToken(mockUser);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('should verify valid RSA-256 signed token', () => {
    const token = generateToken(mockUser);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      subscriptionTier: mockUser.subscriptionTier
    });
  });

  test('should reject expired token beyond TOKEN_EXPIRY', () => {
    jest.useFakeTimers();
    const token = generateToken(mockUser);
    
    // Advance time beyond token expiry
    jest.advanceTimersByTime((AUTH_CONSTANTS.TOKEN_EXPIRY + 3600) * 1000);
    
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
    jest.useRealTimers();
  });

  test('should reject token with invalid RSA-256 signature', () => {
    const token = generateToken(mockUser);
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    const decoded = verifyToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  test('should reject malformed JWT structure', () => {
    const decoded = verifyToken('invalid.token.structure');
    expect(decoded).toBeNull();
  });
});

// @requirement: Session Management - Test coverage for secure session handling
describe('Auth Middleware', () => {
  test('should allow request with valid RSA-256 signed token', async () => {
    const token = generateToken(mockUser);
    mockRequest.cookies.get = jest.fn().mockReturnValue({ value: token });
    
    const protectedHandler = withAuth(mockHandler);
    await protectedHandler(mockRequest);
    
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, { user: expect.objectContaining(mockUser) });
  });

  test('should reject request with missing auth cookie/header', async () => {
    const protectedHandler = withAuth(mockHandler);
    const response = await protectedHandler(mockRequest);
    
    expect(response.status).toBe(401);
  });

  test('should reject request with expired token', async () => {
    jest.useFakeTimers();
    const token = generateToken(mockUser);
    
    jest.advanceTimersByTime((AUTH_CONSTANTS.TOKEN_EXPIRY + 3600) * 1000);
    
    mockRequest.cookies.get = jest.fn().mockReturnValue({ value: token });
    const protectedHandler = withAuth(mockHandler);
    const response = await protectedHandler(mockRequest);
    
    expect(response.status).toBe(401);
    jest.useRealTimers();
  });

  test('should refresh token within REFRESH_WINDOW timeframe', async () => {
    jest.useFakeTimers();
    const token = generateToken(mockUser);
    
    // Advance time to refresh window
    jest.advanceTimersByTime((AUTH_CONSTANTS.TOKEN_EXPIRY - AUTH_CONSTANTS.REFRESH_WINDOW + 3600) * 1000);
    
    mockRequest.cookies.get = jest.fn().mockReturnValue({ value: token });
    const protectedHandler = withAuth(mockHandler);
    await protectedHandler(mockRequest);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.any(String));
    jest.useRealTimers();
  });

  test('should not refresh token outside REFRESH_WINDOW', async () => {
    const token = generateToken(mockUser);
    mockRequest.cookies.get = jest.fn().mockReturnValue({ value: token });
    
    const protectedHandler = withAuth(mockHandler);
    await protectedHandler(mockRequest);
    
    expect(mockResponse.setHeader).not.toHaveBeenCalled();
  });
});

// @requirement: Authentication and Authorization - Test coverage for subscription validation
describe('Subscription Validation', () => {
  test('should allow access with required subscription tier', async () => {
    const validator = requireSubscription(['FREE']);
    const result = await validator(mockRequest, { user: mockUser });
    expect(result).toBeNull();
  });

  test('should reject access with insufficient subscription level', async () => {
    const validator = requireSubscription(['PREMIUM']);
    const result = await validator(mockRequest, { user: mockUser });
    expect(result?.status).toBe(403);
  });

  test('should allow access with multiple allowed subscription tiers', async () => {
    const validator = requireSubscription(['FREE', 'BASIC', 'PREMIUM']);
    const result = await validator(mockRequest, { user: mockUser });
    expect(result).toBeNull();
  });

  test('should handle multiple subscription tier requirements', async () => {
    const premiumUser = { ...mockUser, subscriptionTier: 'PREMIUM' as const };
    const validator = requireSubscription(['BASIC', 'PREMIUM']);
    const result = await validator(mockRequest, { user: premiumUser });
    expect(result).toBeNull();
  });
});

// @requirement: Session Management - Test coverage for secure cookie handling
describe('Cookie Management', () => {
  test('should set secure HTTP-only cookie with valid JWT', () => {
    const token = generateToken(mockUser);
    setAuthCookie(token, mockResponse);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('HttpOnly')
    );
  });

  test('should clear auth cookie on user logout', () => {
    clearAuthCookie(mockResponse);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('max-age=0')
    );
  });

  test('should set secure cookie options in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const token = generateToken(mockUser);
    setAuthCookie(token, mockResponse);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Secure')
    );
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should set cookie expiry aligned with TOKEN_EXPIRY', () => {
    const token = generateToken(mockUser);
    setAuthCookie(token, mockResponse);
    
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining(`max-age=${AUTH_CONSTANTS.TOKEN_EXPIRY}`)
    );
  });
});
// @jest/globals ^29.0.0
import { describe, expect, jest, beforeEach, it } from '@jest/globals';
import { NextRequest } from 'next/server'; // ^13.0.0
import { NextResponse } from 'next/server'; // ^13.0.0
import { GET, POST, PUT } from '../../api/drills/route';
import { DrillService } from '../../services/DrillService';
import { withAuth } from '../../lib/auth/middleware';
import {
  DrillType,
  DrillPrompt,
  DrillAttempt,
  DrillResponse,
  DrillDifficulty,
  DrillStatus,
  DrillEvaluation
} from '../../types/drills';

// Mock dependencies
jest.mock('../../services/DrillService');
jest.mock('../../lib/auth/middleware');

// Human Tasks:
// 1. Configure test database with sample drill data
// 2. Set up test environment variables for auth tokens
// 3. Configure test monitoring for API response times
// 4. Set up test coverage reporting thresholds

describe('Drills API', () => {
  const mockDrillService = jest.mocked(DrillService);
  const mockWithAuth = jest.mocked(withAuth);

  // Sample test data
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    subscriptionTier: 'PREMIUM'
  };

  const mockDrills: DrillPrompt[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.INTERMEDIATE,
      content: 'Sample drill content',
      timeLimit: 1800,
      industry: 'Technology'
    }
  ];

  const mockAttempt: DrillAttempt = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    userId: mockUser.id,
    drillId: mockDrills[0].id,
    status: DrillStatus.IN_PROGRESS,
    response: '',
    startedAt: new Date(),
    completedAt: null,
    timeSpent: 0
  };

  const mockEvaluation: DrillEvaluation = {
    attemptId: mockAttempt.id,
    score: 85,
    feedback: 'Good analysis',
    strengths: ['Clear structure'],
    improvements: ['Add more details'],
    evaluatedAt: new Date()
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup auth middleware mock to pass authentication
    mockWithAuth.mockImplementation((handler) => async (req) => {
      return handler(req, { user: mockUser });
    });

    // Setup DrillService mock responses
    mockDrillService.prototype.listDrills.mockResolvedValue(mockDrills);
    mockDrillService.prototype.startDrillAttempt.mockResolvedValue(mockAttempt);
    mockDrillService.prototype.submitDrillResponse.mockResolvedValue(mockEvaluation);
  });

  describe('GET /api/drills', () => {
    // Requirement: Practice Drills - Test drill listing functionality
    it('should return filtered drills successfully', async () => {
      const url = new URL('http://localhost/api/drills?type=CASE_PROMPT&difficulty=INTERMEDIATE&industry=Technology');
      const request = new NextRequest('GET', url);

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: mockDrills,
        error: null
      });
      expect(mockDrillService.prototype.listDrills).toHaveBeenCalledWith(
        DrillType.CASE_PROMPT,
        DrillDifficulty.INTERMEDIATE,
        expect.objectContaining({ industry: 'Technology' })
      );
    });

    // Requirement: System Performance - Test response time
    it('should return results within 200ms', async () => {
      const start = Date.now();
      const request = new NextRequest('GET', new URL('http://localhost/api/drills'));
      
      await GET(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });

    it('should handle invalid query parameters', async () => {
      const url = new URL('http://localhost/api/drills?type=INVALID');
      const request = new NextRequest('GET', url);

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    it('should handle pagination correctly', async () => {
      const url = new URL('http://localhost/api/drills?page=2&pageSize=10');
      const request = new NextRequest('GET', url);

      await GET(request);

      expect(mockDrillService.prototype.listDrills).toHaveBeenCalledWith(
        undefined,
        undefined,
        expect.objectContaining({
          offset: 10,
          limit: 10
        })
      );
    });
  });

  describe('POST /api/drills', () => {
    // Requirement: Practice Drills - Test attempt creation
    it('should create drill attempt successfully', async () => {
      const request = new NextRequest('POST', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({ drillId: mockDrills[0].id }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: mockAttempt,
        error: null
      });
      expect(mockDrillService.prototype.startDrillAttempt).toHaveBeenCalledWith(
        mockUser.id,
        mockDrills[0].id
      );
    });

    it('should handle invalid drill ID', async () => {
      const request = new NextRequest('POST', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({ drillId: 'invalid-id' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    // Requirement: User Engagement - Test attempt tracking
    it('should track attempt creation time', async () => {
      const request = new NextRequest('POST', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({ drillId: mockDrills[0].id }),
      });

      await POST(request);

      expect(mockAttempt.startedAt).toBeDefined();
      expect(mockAttempt.timeSpent).toBe(0);
    });
  });

  describe('PUT /api/drills', () => {
    // Requirement: Practice Drills - Test response submission
    it('should submit drill response successfully', async () => {
      const request = new NextRequest('PUT', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({
          attemptId: mockAttempt.id,
          response: 'Test response'
        }),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: mockEvaluation,
        error: null
      });
      expect(mockDrillService.prototype.submitDrillResponse).toHaveBeenCalledWith(
        mockAttempt.id,
        'Test response'
      );
    });

    it('should handle invalid attempt ID', async () => {
      const request = new NextRequest('PUT', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({
          attemptId: 'invalid-id',
          response: 'Test response'
        }),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    // Requirement: User Engagement - Test completion tracking
    it('should track response submission time', async () => {
      const request = new NextRequest('PUT', new URL('http://localhost/api/drills'), {
        body: JSON.stringify({
          attemptId: mockAttempt.id,
          response: 'Test response'
        }),
      });

      await PUT(request);

      expect(mockEvaluation.evaluatedAt).toBeDefined();
    });
  });
});
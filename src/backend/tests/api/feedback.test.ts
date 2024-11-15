// Jest testing framework v29.0.0
import { describe, it, expect, beforeEach, afterEach, jest } from 'jest';
import { GET, POST, PATCH } from '../../api/feedback/route';
import { FeedbackService } from '../../services/FeedbackService';
import { APIError, APIErrorCode } from '../../lib/errors/APIError';

/**
 * Human Tasks:
 * 1. Configure test environment variables for authentication tokens
 * 2. Set up test database with sample feedback data
 * 3. Configure test coverage thresholds
 * 4. Set up CI pipeline test automation
 */

// Mock FeedbackService
jest.mock('../../services/FeedbackService');

// Mock feedback data
const mockFeedbackData = {
  id: 'test-feedback-id',
  attemptId: 'test-attempt-id',
  type: 'drill',
  score: 85,
  feedback: 'Test feedback content',
  createdAt: '2024-01-01T00:00:00Z'
};

// Helper function to create mock FeedbackService instance
const mockFeedbackService = () => {
  const mock = {
    generateFeedback: jest.fn().mockResolvedValue(mockFeedbackData),
    getFeedback: jest.fn().mockResolvedValue(mockFeedbackData),
    getAttemptFeedback: jest.fn().mockResolvedValue([mockFeedbackData]),
    updateFeedback: jest.fn().mockResolvedValue(undefined)
  };
  (FeedbackService as jest.Mock).mockImplementation(() => mock);
  return mock;
};

// Helper function to create mock request
const createMockRequest = ({ 
  method = 'GET', 
  headers = {}, 
  body = null,
  searchParams = {}
}) => {
  const url = new URL('http://test.com');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value as string);
  });

  return {
    method,
    headers: {
      'authorization': 'Bearer test-token',
      'x-request-id': 'test-request-id',
      ...headers
    },
    url: url.toString(),
    json: jest.fn().mockResolvedValue(body)
  };
};

describe('Feedback API Endpoints', () => {
  let feedbackServiceMock: ReturnType<typeof mockFeedbackService>;

  beforeEach(() => {
    feedbackServiceMock = mockFeedbackService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @requirement AI Evaluation - Core service providing consistent, objective feedback
   */
  describe('GET /api/feedback', () => {
    it('should return feedback by ID', async () => {
      const request = createMockRequest({ 
        searchParams: { feedbackId: 'test-feedback-id' } 
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockFeedbackData });
      expect(feedbackServiceMock.getFeedback).toHaveBeenCalledWith('test-feedback-id');
    });

    it('should return feedback by attempt ID', async () => {
      const request = createMockRequest({ 
        searchParams: { attemptId: 'test-attempt-id' } 
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: [mockFeedbackData] });
      expect(feedbackServiceMock.getAttemptFeedback).toHaveBeenCalledWith('test-attempt-id');
    });

    it('should handle not found errors', async () => {
      feedbackServiceMock.getFeedback.mockResolvedValue(null);
      const request = createMockRequest({ 
        searchParams: { feedbackId: 'non-existent-id' } 
      });

      const response = await GET(request);
      const error = await response.json();

      expect(response.status).toBe(404);
      expect(error.code).toBe(APIErrorCode.NOT_FOUND);
    });

    it('should handle missing parameters', async () => {
      const request = createMockRequest({});

      const response = await GET(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe(APIErrorCode.VALIDATION_ERROR);
    });
  });

  /**
   * @requirement Progress Tracking - Performance analytics and progress tracking
   */
  describe('POST /api/feedback', () => {
    const validPayload = {
      attemptId: 'test-attempt-id',
      type: 'drill',
      response: {
        content: 'Test response',
        metadata: { key: 'value' }
      }
    };

    it('should generate new feedback', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: validPayload
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ data: mockFeedbackData });
      expect(feedbackServiceMock.generateFeedback).toHaveBeenCalledWith(
        validPayload.attemptId,
        validPayload.type,
        validPayload.response
      );
    });

    it('should validate request payload', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: { invalidData: true }
      });

      const response = await POST(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe(APIErrorCode.VALIDATION_ERROR);
    });

    it('should handle AI service errors', async () => {
      feedbackServiceMock.generateFeedback.mockRejectedValue(new Error('AI service error'));
      const request = createMockRequest({ 
        method: 'POST',
        body: validPayload
      });

      const response = await POST(request);
      const error = await response.json();

      expect(response.status).toBe(500);
      expect(error.code).toBe(APIErrorCode.INTERNAL_ERROR);
    });
  });

  /**
   * @requirement Progress Tracking - Performance analytics and progress tracking
   */
  describe('PATCH /api/feedback', () => {
    const validUpdateData = {
      content: {
        summary: 'Updated summary',
        strengths: ['strength1'],
        improvements: ['improvement1']
      },
      score: 90
    };

    it('should update existing feedback', async () => {
      const request = createMockRequest({ 
        method: 'PATCH',
        searchParams: { feedbackId: 'test-feedback-id' },
        body: validUpdateData
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Feedback updated successfully' });
      expect(feedbackServiceMock.updateFeedback).toHaveBeenCalledWith(
        'test-feedback-id',
        validUpdateData
      );
    });

    it('should validate update data', async () => {
      const request = createMockRequest({ 
        method: 'PATCH',
        searchParams: { feedbackId: 'test-feedback-id' },
        body: { invalidData: true }
      });

      feedbackServiceMock.updateFeedback.mockRejectedValue(
        new APIError(APIErrorCode.VALIDATION_ERROR, 'Invalid update data', {}, 'test-request-id')
      );

      const response = await PATCH(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe(APIErrorCode.VALIDATION_ERROR);
    });

    it('should handle not found errors', async () => {
      feedbackServiceMock.updateFeedback.mockRejectedValue(
        new APIError(APIErrorCode.NOT_FOUND, 'Feedback not found', {}, 'test-request-id')
      );

      const request = createMockRequest({ 
        method: 'PATCH',
        searchParams: { feedbackId: 'non-existent-id' },
        body: validUpdateData
      });

      const response = await PATCH(request);
      const error = await response.json();

      expect(response.status).toBe(404);
      expect(error.code).toBe(APIErrorCode.NOT_FOUND);
    });

    it('should require feedback ID', async () => {
      const request = createMockRequest({ 
        method: 'PATCH',
        body: validUpdateData
      });

      const response = await PATCH(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe(APIErrorCode.VALIDATION_ERROR);
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.0.0
import { FeedbackService } from '../../services/FeedbackService';
import { Feedback } from '../../models/Feedback';
import { OpenAIService } from '../../lib/openai';
import { APIErrorCode } from '../../types/api';

// Mock external dependencies
jest.mock('../../models/Feedback');
jest.mock('../../lib/openai');

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let mockFeedback: jest.Mocked<typeof Feedback>;

  const testData = {
    attemptId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'drill' as const,
    response: {
      content: 'Test response content',
      metadata: { difficulty: 'medium' }
    },
    evaluation: {
      score: 85,
      strengths: ['Good clarity', 'Structured approach'],
      improvements: ['Add more detail'],
      feedback: 'Detailed analysis of performance',
      metrics: [
        { name: 'clarity', score: 90, feedback: 'Very clear', category: 'communication' }
      ]
    }
  };

  beforeEach(() => {
    // Setup mocks
    mockOpenAIService = {
      evaluateDrillResponse: jest.fn(),
      generateFeedback: jest.fn()
    } as unknown as jest.Mocked<OpenAIService>;

    mockFeedback = {
      findById: jest.fn(),
      findByAttempt: jest.fn()
    } as unknown as jest.Mocked<typeof Feedback>;

    // Initialize service
    feedbackService = new FeedbackService(mockOpenAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFeedback', () => {
    // @requirement: AI Evaluation - Verify AI evaluation functionality
    it('should generate and store feedback successfully', async () => {
      mockOpenAIService.evaluateDrillResponse.mockResolvedValue(testData.evaluation);
      mockOpenAIService.generateFeedback.mockResolvedValue('Detailed feedback');

      const result = await feedbackService.generateFeedback(
        testData.attemptId,
        testData.type,
        testData.response
      );

      expect(result).toBeDefined();
      expect(mockOpenAIService.evaluateDrillResponse).toHaveBeenCalledWith(
        testData.type,
        testData.response.content,
        testData.response.metadata
      );
      expect(mockOpenAIService.generateFeedback).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        attemptId: 'invalid-uuid',
        type: 'invalid-type',
        response: { content: '' }
      };

      await expect(
        feedbackService.generateFeedback(
          invalidData.attemptId,
          invalidData.type as any,
          invalidData.response
        )
      ).rejects.toMatchObject({
        code: APIErrorCode.VALIDATION_ERROR
      });
    });

    // @requirement: System Performance - Validate API response time
    it('should implement retry logic for failed AI requests', async () => {
      mockOpenAIService.evaluateDrillResponse
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(testData.evaluation);
      
      mockOpenAIService.generateFeedback.mockResolvedValue('Feedback content');

      const result = await feedbackService.generateFeedback(
        testData.attemptId,
        testData.type,
        testData.response
      );

      expect(result).toBeDefined();
      expect(mockOpenAIService.evaluateDrillResponse).toHaveBeenCalledTimes(3);
    });
  });

  describe('getFeedback', () => {
    const feedbackId = '123e4567-e89b-12d3-a456-426614174000';
    const mockFeedbackData = {
      id: feedbackId,
      ...testData.evaluation
    };

    // @requirement: System Performance - Validate caching mechanisms
    it('should return cached feedback if available', async () => {
      // First call to populate cache
      mockFeedback.findById.mockResolvedValueOnce(mockFeedbackData);
      await feedbackService.getFeedback(feedbackId);

      // Second call should use cache
      const result = await feedbackService.getFeedback(feedbackId);

      expect(result).toEqual(mockFeedbackData);
      expect(mockFeedback.findById).toHaveBeenCalledTimes(1);
    });

    it('should fetch and cache feedback if not in cache', async () => {
      mockFeedback.findById.mockResolvedValueOnce(mockFeedbackData);

      const result = await feedbackService.getFeedback(feedbackId);

      expect(result).toEqual(mockFeedbackData);
      expect(mockFeedback.findById).toHaveBeenCalledWith(feedbackId);
    });

    it('should handle non-existent feedback', async () => {
      mockFeedback.findById.mockResolvedValueOnce(null);

      const result = await feedbackService.getFeedback(feedbackId);

      expect(result).toBeNull();
    });
  });

  describe('getAttemptFeedback', () => {
    it('should retrieve all feedback for an attempt', async () => {
      const mockFeedbackList = [
        { id: '1', ...testData.evaluation },
        { id: '2', ...testData.evaluation }
      ];

      mockFeedback.findByAttempt.mockResolvedValueOnce(mockFeedbackList);

      const result = await feedbackService.getAttemptFeedback(testData.attemptId);

      expect(result).toEqual(mockFeedbackList);
      expect(mockFeedback.findByAttempt).toHaveBeenCalledWith(testData.attemptId);
    });

    it('should validate attempt ID format', async () => {
      await expect(
        feedbackService.getAttemptFeedback('invalid-uuid')
      ).rejects.toMatchObject({
        code: APIErrorCode.VALIDATION_ERROR
      });
    });
  });

  describe('updateFeedback', () => {
    const feedbackId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      content: {
        summary: 'Updated summary',
        strengths: ['Improved clarity'],
        improvements: ['Need more detail'],
        detailedAnalysis: 'Updated analysis'
      },
      score: 90,
      metrics: [
        {
          name: 'accuracy',
          score: 85,
          feedback: 'Good accuracy',
          category: 'technical'
        }
      ]
    };

    it('should update feedback and invalidate cache', async () => {
      const mockFeedbackInstance = {
        update: jest.fn().mockResolvedValueOnce(undefined)
      };

      mockFeedback.findById.mockResolvedValueOnce(mockFeedbackInstance);

      await feedbackService.updateFeedback(feedbackId, updateData);

      expect(mockFeedback.findById).toHaveBeenCalledWith(feedbackId);
      expect(mockFeedbackInstance.update).toHaveBeenCalledWith(updateData);

      // Verify cache invalidation by checking if a subsequent get request hits the database
      mockFeedback.findById.mockResolvedValueOnce({ ...mockFeedbackInstance, ...updateData });
      await feedbackService.getFeedback(feedbackId);
      expect(mockFeedback.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle non-existent feedback', async () => {
      mockFeedback.findById.mockResolvedValueOnce(null);

      await expect(
        feedbackService.updateFeedback(feedbackId, updateData)
      ).rejects.toMatchObject({
        code: APIErrorCode.NOT_FOUND
      });
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        content: {
          summary: 123, // Invalid type
          strengths: 'not an array' // Invalid type
        }
      };

      await expect(
        feedbackService.updateFeedback(feedbackId, invalidUpdateData)
      ).rejects.toMatchObject({
        code: APIErrorCode.VALIDATION_ERROR
      });
    });
  });
});
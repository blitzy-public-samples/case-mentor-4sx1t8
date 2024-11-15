import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'; // ^29.7.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { DrillAttemptModel } from '../../models/DrillAttempt';
import { DrillType, DrillStatus, DrillAttempt } from '../../types/drills';

// Human Tasks:
// 1. Set up test database environment variables
// 2. Configure test coverage thresholds
// 3. Set up CI/CD pipeline test stage
// 4. Configure test data cleanup procedures

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}));

describe('DrillAttemptModel', () => {
  let mockDrillAttempt: DrillAttempt;
  let drillAttemptModel: DrillAttemptModel;
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockDate = new Date('2023-01-01T00:00:00Z');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize mock data
    mockDrillAttempt = {
      id: mockUuid,
      userId: mockUuid,
      drillId: mockUuid,
      status: DrillStatus.NOT_STARTED,
      response: '',
      startedAt: mockDate,
      completedAt: null,
      timeSpent: 0
    };

    // Initialize model instance
    drillAttemptModel = new DrillAttemptModel(mockDrillAttempt);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    // @requirement Practice Drills - Test validation of drill attempts
    it('should initialize with valid drill attempt data', () => {
      expect(drillAttemptModel).toBeInstanceOf(DrillAttemptModel);
      expect(drillAttemptModel.id).toBe(mockUuid);
    });

    it('should set default NOT_STARTED status for new attempts', () => {
      expect(drillAttemptModel.status).toBe(DrillStatus.NOT_STARTED);
    });

    it('should validate required userId and drillId fields', () => {
      expect(() => new DrillAttemptModel({
        ...mockDrillAttempt,
        userId: ''
      } as any)).toThrow();
      
      expect(() => new DrillAttemptModel({
        ...mockDrillAttempt,
        drillId: ''
      } as any)).toThrow();
    });

    it('should initialize startedAt timestamp', () => {
      expect(drillAttemptModel.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('save', () => {
    // @requirement Practice Drills - Test persistence of drill attempts
    it('should save new drill attempt to database', async () => {
      const mockResponse = { data: mockDrillAttempt, error: null };
      const supabaseClient = createClient('', '');
      (supabaseClient.from('').single as jest.Mock).mockResolvedValue(mockResponse);

      const result = await drillAttemptModel.save();
      expect(result).toEqual(mockDrillAttempt);
    });

    it('should update existing drill attempt', async () => {
      const updatedAttempt = { ...mockDrillAttempt, response: 'Updated response' };
      const mockResponse = { data: updatedAttempt, error: null };
      const supabaseClient = createClient('', '');
      (supabaseClient.from('').single as jest.Mock).mockResolvedValue(mockResponse);

      drillAttemptModel.response = 'Updated response';
      const result = await drillAttemptModel.save();
      expect(result.response).toBe('Updated response');
    });

    it('should handle validation errors', async () => {
      const mockError = { message: 'Database error' };
      const supabaseClient = createClient('', '');
      (supabaseClient.from('').single as jest.Mock).mockResolvedValue({ data: null, error: mockError });

      await expect(drillAttemptModel.save()).rejects.toThrow('Failed to save drill attempt');
    });
  });

  describe('complete', () => {
    // @requirement User Engagement - Test completion rate tracking
    it('should mark drill as COMPLETED', async () => {
      const mockResponse = 'This is a valid response';
      const mockResult = {
        evaluation: {
          attemptId: mockUuid,
          score: 85,
          feedback: 'Good work',
          strengths: ['structure'],
          improvements: ['detail'],
          evaluatedAt: new Date()
        }
      };

      jest.spyOn(drillAttemptModel as any, 'save').mockResolvedValue(mockDrillAttempt);
      const result = await drillAttemptModel.complete(mockResponse);

      expect(drillAttemptModel.status).toBe(DrillStatus.EVALUATED);
      expect(drillAttemptModel.completedAt).toBeInstanceOf(Date);
    });

    it('should calculate timeSpent from startedAt to completedAt', async () => {
      const mockResponse = 'Valid response';
      jest.spyOn(drillAttemptModel as any, 'save').mockResolvedValue(mockDrillAttempt);
      
      await drillAttemptModel.complete(mockResponse);
      expect(drillAttemptModel.timeSpent).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid responses', async () => {
      await expect(drillAttemptModel.complete('')).rejects.toThrow('Invalid response format');
    });

    it('should validate response length', async () => {
      const longResponse = 'a'.repeat(9000);
      await expect(drillAttemptModel.complete(longResponse)).rejects.toThrow('Invalid response format');
    });
  });

  describe('calculateMetrics', () => {
    // @requirement User Engagement - Test performance metrics calculation
    it('should calculate completion percentage', () => {
      drillAttemptModel.response = 'Test response';
      const metrics = drillAttemptModel.calculateMetrics();
      expect(metrics.completeness).toBeGreaterThan(0);
      expect(metrics.completeness).toBeLessThanOrEqual(100);
    });

    it('should compute time-based metrics', () => {
      drillAttemptModel.timeSpent = 300;
      const metrics = drillAttemptModel.calculateMetrics();
      expect(metrics.speed).toBeDefined();
      expect(metrics.timeSpent).toBe(300);
    });

    it('should handle missing evaluation data', () => {
      const metrics = drillAttemptModel.calculateMetrics();
      expect(metrics.accuracy).toBe(0);
    });

    it('should normalize metrics to 0-100 scale', () => {
      drillAttemptModel.evaluation = {
        attemptId: mockUuid,
        score: 85,
        feedback: 'Good',
        strengths: [],
        improvements: [],
        evaluatedAt: new Date()
      };

      const metrics = drillAttemptModel.calculateMetrics();
      expect(metrics.accuracy).toBeLessThanOrEqual(100);
      expect(metrics.completeness).toBeLessThanOrEqual(100);
      expect(metrics.speed).toBeLessThanOrEqual(100);
    });

    it('should include accuracy metrics when evaluation exists', () => {
      drillAttemptModel.evaluation = {
        attemptId: mockUuid,
        score: 90,
        feedback: 'Excellent',
        strengths: ['analysis'],
        improvements: [],
        evaluatedAt: new Date()
      };

      const metrics = drillAttemptModel.calculateMetrics();
      expect(metrics.accuracy).toBe(90);
    });
  });
});
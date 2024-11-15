// Human Tasks:
// 1. Configure test database environment variables for Supabase
// 2. Set up test Redis instance for cache testing
// 3. Verify test coverage thresholds in Jest configuration
// 4. Configure test timeouts for performance assertions

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.7.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import Redis from 'ioredis'; // ^5.3.0
import { 
  DrillService,
  getDrillById,
  listDrills,
  startDrillAttempt,
  submitDrillResponse,
  getUserDrillHistory 
} from '../../services/DrillService';
import {
  DrillType,
  DrillStatus,
  DrillPrompt,
  DrillAttempt,
  DrillEvaluation,
  DrillDifficulty
} from '../../types/drills';
import { DrillAttemptModel } from '../../models/DrillAttempt';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

// Global constants from specification
const DRILL_CACHE_TTL = 300;
const MAX_CONCURRENT_ATTEMPTS = 3;

@jest.describe('DrillService')
class DrillServiceTest {
  private drillService: DrillService;
  private mockDb: jest.Mocked<typeof createClient>;
  private mockCache: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize mock database
    this.mockDb = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis()
    } as any;

    // Initialize mock cache
    this.mockCache = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn()
    } as any;

    this.drillService = new DrillService(this.mockDb as any, this.mockCache as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tests drill retrieval by ID functionality
   * @requirement Practice Drills - Drill content retrieval
   * @requirement System Performance - <200ms response time
   */
  async testGetDrillById() {
    // Mock sample drill data
    const mockDrill: DrillPrompt = {
      id: '123',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.INTERMEDIATE,
      content: 'Sample case prompt',
      timeLimit: 1800,
      industry: 'Technology'
    };

    // Test cache miss scenario
    this.mockCache.get.mockResolvedValueOnce(null);
    this.mockDb.from().select().eq().single.mockResolvedValueOnce({ data: mockDrill, error: null });

    const startTime = Date.now();
    const result = await this.drillService.getDrillById('123');
    const endTime = Date.now();

    // Verify performance requirement
    expect(endTime - startTime).toBeLessThan(200);
    expect(result).toEqual(mockDrill);
    expect(this.mockCache.setex).toHaveBeenCalledWith(
      'drill:123',
      DRILL_CACHE_TTL,
      JSON.stringify(mockDrill)
    );

    // Test cache hit scenario
    this.mockCache.get.mockResolvedValueOnce(JSON.stringify(mockDrill));
    const cachedResult = await this.drillService.getDrillById('123');
    expect(cachedResult).toEqual(mockDrill);
    expect(this.mockDb.from).not.toHaveBeenCalled();

    // Test invalid drill ID scenario
    this.mockCache.get.mockResolvedValueOnce(null);
    this.mockDb.from().select().eq().single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });
    await expect(this.drillService.getDrillById('invalid')).rejects.toThrow('Drill not found');
  }

  /**
   * Tests drill listing with filters
   * @requirement Practice Drills - Filtered drill access
   * @requirement System Performance - <200ms response time
   */
  async testListDrills() {
    const mockDrills: DrillPrompt[] = [
      {
        id: '123',
        type: DrillType.CASE_PROMPT,
        difficulty: DrillDifficulty.BEGINNER,
        content: 'Sample case 1',
        timeLimit: 1800,
        industry: 'Technology'
      },
      {
        id: '124',
        type: DrillType.MARKET_SIZING,
        difficulty: DrillDifficulty.ADVANCED,
        content: 'Sample case 2',
        timeLimit: 1800,
        industry: 'Healthcare'
      }
    ];

    this.mockDb.from().select().mockResolvedValueOnce({ data: mockDrills, error: null });

    const startTime = Date.now();
    const result = await this.drillService.listDrills(DrillType.CASE_PROMPT, DrillDifficulty.BEGINNER);
    const endTime = Date.now();

    // Verify performance requirement
    expect(endTime - startTime).toBeLessThan(200);
    expect(result).toEqual(mockDrills);
    expect(this.mockDb.from).toHaveBeenCalledWith('drills');
    expect(this.mockDb.select).toHaveBeenCalledWith('*');

    // Test empty result scenario
    this.mockDb.from().select().mockResolvedValueOnce({ data: [], error: null });
    const emptyResult = await this.drillService.listDrills();
    expect(emptyResult).toEqual([]);
  }

  /**
   * Tests drill attempt initiation
   * @requirement Practice Drills - Track user attempts
   * @requirement User Engagement - Monitor completion rates
   */
  async testStartDrillAttempt() {
    const mockAttempt: DrillAttempt = {
      id: '123',
      userId: 'user123',
      drillId: 'drill123',
      status: DrillStatus.NOT_STARTED,
      response: '',
      startedAt: new Date(),
      completedAt: null,
      timeSpent: 0
    };

    // Mock successful validation
    jest.spyOn(this.drillService as any, 'validateDrillAccess').mockResolvedValueOnce(true);
    jest.spyOn(DrillAttemptModel.prototype, 'save').mockResolvedValueOnce(mockAttempt);

    const startTime = Date.now();
    const result = await this.drillService.startDrillAttempt('user123', 'drill123');
    const endTime = Date.now();

    // Verify performance requirement
    expect(endTime - startTime).toBeLessThan(200);
    expect(result).toEqual(mockAttempt);

    // Test concurrent attempt limit
    jest.spyOn(this.drillService as any, 'validateDrillAccess').mockResolvedValueOnce(false);
    await expect(this.drillService.startDrillAttempt('user123', 'drill123'))
      .rejects.toThrow('Access denied or attempt limit reached');
  }

  /**
   * Tests drill response submission and evaluation
   * @requirement Practice Drills - AI-powered evaluation
   * @requirement System Performance - <200ms response time
   */
  async testSubmitDrillResponse() {
    const mockEvaluation: DrillEvaluation = {
      attemptId: '123',
      score: 85,
      feedback: 'Good analysis',
      strengths: ['Clear structure'],
      improvements: ['Add more quantitative analysis'],
      evaluatedAt: new Date()
    };

    const mockAttempt = {
      id: '123',
      status: DrillStatus.IN_PROGRESS,
      complete: jest.fn().mockResolvedValueOnce({ evaluation: mockEvaluation })
    };

    jest.spyOn(DrillAttemptModel, 'findById').mockResolvedValueOnce(mockAttempt as any);

    const startTime = Date.now();
    const result = await this.drillService.submitDrillResponse('123', 'Sample response');
    const endTime = Date.now();

    // Verify performance requirement
    expect(endTime - startTime).toBeLessThan(200);
    expect(result).toEqual(mockEvaluation);
    expect(mockAttempt.complete).toHaveBeenCalledWith('Sample response');

    // Test invalid attempt scenario
    jest.spyOn(DrillAttemptModel, 'findById').mockResolvedValueOnce(null);
    await expect(this.drillService.submitDrillResponse('invalid', 'response'))
      .rejects.toThrow('Attempt not found');
  }

  /**
   * Tests user drill history retrieval
   * @requirement User Engagement - Track user progress
   * @requirement System Performance - <200ms response time
   */
  async testGetUserDrillHistory() {
    const mockHistory: DrillAttempt[] = [
      {
        id: '123',
        userId: 'user123',
        drillId: 'drill123',
        status: DrillStatus.COMPLETED,
        response: 'Sample response',
        startedAt: new Date(),
        completedAt: new Date(),
        timeSpent: 1200
      }
    ];

    this.mockDb.from().select().eq().mockResolvedValueOnce({ data: mockHistory, error: null });

    const startTime = Date.now();
    const result = await this.drillService.getUserDrillHistory('user123', {
      startDate: new Date(),
      type: DrillType.CASE_PROMPT
    });
    const endTime = Date.now();

    // Verify performance requirement
    expect(endTime - startTime).toBeLessThan(200);
    expect(result).toEqual(mockHistory);
    expect(this.mockDb.from).toHaveBeenCalledWith('drill_attempts');
    expect(this.mockDb.select).toHaveBeenCalledWith('*, evaluations(*)');

    // Test empty history scenario
    this.mockDb.from().select().eq().mockResolvedValueOnce({ data: [], error: null });
    const emptyResult = await this.drillService.getUserDrillHistory('user123');
    expect(emptyResult).toEqual([]);
  }
}
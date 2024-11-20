// @jest/globals version: ^29.0.0
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
// @testing-library/react-hooks version: ^8.0.0
import { renderHook, act } from '@testing-library/react-hooks';
// @testing-library/react version: ^13.0.0
import { waitFor } from '@testing-library/react';

import { useDrills } from '../../hooks/use-drills';
import { apiClient } from '../../lib/api-client';
import type { DrillTemplate, DrillAttempt, DrillType, DrillDifficulty } from '../../types/drills';

// Mock the API client
jest.mock('../../lib/api-client');
const mockedApiClient = jest.mocked(apiClient);

// Mock the auth hook
jest.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    authState: {
      user: { id: 'test-user-id' }
    }
  })
}));

describe('useDrills hook', () => {
  let mockDrills: DrillTemplate[];
  let mockAttempts: DrillAttempt[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDrills = mockDrillTemplates();
    mockAttempts = mockDrillAttempts();

    // Setup default successful API responses
    mockedApiClient.get.mockImplementation(async (url) => {
      if (url.includes('/api/drills')) {
        return { success: true, data: mockDrills };
      } else if (url.includes('/drill-attempts')) {
        return { success: true, data: mockAttempts };
      }
      return { success: false, data: null };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @requirement Practice Drills
   * Helper function to generate mock drill templates
   */
  function mockDrillTemplates(): DrillTemplate[] {
    return [
      {
        id: 'drill-1',
        type: 'CASE_PROMPT' as DrillType,
        difficulty: 'BEGINNER' as DrillDifficulty,
        title: 'Mock Case Prompt',
        description: 'Test case prompt drill',
        timeLimit: 1800,
        evaluationCriteria: [
          {
            category: 'Structure',
            weight: 0.4,
            rubric: { 1: 'Poor', 3: 'Good', 5: 'Excellent' },
            maxScore: 5,
            passingThreshold: 3
          }
        ],
        templateData: {},
        prerequisites: [],
        benchmarkMetrics: {
          timeSpent: 1500,
          attemptsCount: 1,
          averageScore: 4,
          completionRate: 0.8,
          strengthAreas: [],
          improvementAreas: []
        }
      }
    ];
  }

  /**
   * @requirement User Management
   * Helper function to generate mock drill attempts
   */
  function mockDrillAttempts(): DrillAttempt[] {
    return [
      {
        id: 'attempt-1',
        userId: 'test-user-id',
        drillId: 'drill-1',
        status: 'COMPLETED',
        startedAt: new Date('2023-01-01'),
        completedAt: new Date('2023-01-01'),
        response: {},
        score: 4,
        criteriaScores: { Structure: 4 },
        feedback: 'Good attempt',
        performanceMetrics: {
          timeSpent: 1500,
          attemptsCount: 1,
          averageScore: 4,
          completionRate: 1,
          strengthAreas: [],
          improvementAreas: []
        }
      }
    ];
  }

  /**
   * @requirement Practice Drills
   * Test fetching available drills on mount
   */
  it('should fetch available drills on mount', async () => {
    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/drills', {});
    expect(result.current.drills).toEqual(mockDrills);
    expect(result.current.error).toBeNull();
  });

  /**
   * @requirement User Management
   * Test fetching user attempts on mount
   */
  it('should fetch user attempts on mount', async () => {
    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/users/test-user-id/drill-attempts');
    expect(result.current.userAttempts).toEqual(mockAttempts);
  });

  /**
   * @requirement Practice Drills
   * Test drill filtering functionality
   */
  it('should handle drill filtering', async () => {
    const filters = {
      type: 'CASE_PROMPT' as DrillType,
      difficulty: 'BEGINNER' as DrillDifficulty
    };

    const { result } = renderHook(() => useDrills(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/drills', filters);
  });

  /**
   * @requirement Practice Drills
   * Test starting a new drill attempt
   */
  it('should start new drill attempt', async () => {
    const mockNewAttempt = {
      id: 'new-attempt',
      status: 'IN_PROGRESS',
      drillId: 'drill-1',
      userId: 'test-user-id'
    };

    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockNewAttempt
    });

    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await act(async () => {
      await result.current.startDrill('drill-1');
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/drill-attempts', {
      drillId: 'drill-1',
      userId: 'test-user-id',
      status: 'IN_PROGRESS'
    });
  });

  /**
   * @requirement Practice Drills
   * Test error handling in the hook
   */
  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch drills';
    mockedApiClient.get.mockRejectedValueOnce({
      success: false,
      error: { message: errorMessage }
    });

    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.drills).toEqual([]);
  });

  /**
   * @requirement User Management
   * Test submitting a drill attempt
   */
  it('should submit drill attempt', async () => {
    const mockSubmittedAttempt = {
      ...mockAttempts[0],
      status: 'COMPLETED',
      score: 4.5
    };

    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockSubmittedAttempt
    });

    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await act(async () => {
      await result.current.submitDrillAttempt('attempt-1', {
        answers: ['test answer']
      });
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/drill-attempts/attempt-1/submit',
      { response: { answers: ['test answer'] } }
    );
  });

  /**
   * @requirement Practice Drills
   * Test abandoning a drill attempt
   */
  it('should abandon drill attempt', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: null
    });

    const { result } = renderHook(() => 
      useDrills({ type: null, difficulty: null })
    );

    await act(async () => {
      await result.current.abandonDrill('attempt-1');
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/drill-attempts/attempt-1/abandon'
    );
  });
});
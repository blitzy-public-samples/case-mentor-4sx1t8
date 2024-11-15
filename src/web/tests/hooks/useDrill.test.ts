// @testing-library/react ^14.0.0
import { renderHook, act, waitFor } from '@testing-library/react';
// @jest/globals ^29.7.0
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
// @tanstack/react-query ^4.0.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDrill } from '../../hooks/useDrill';
import {
  DrillType,
  DrillPrompt,
  DrillAttempt,
  DrillProgress,
  DrillResponse,
  DrillDifficulty,
  DrillFeedback
} from '../../types/drills';

// Human Tasks:
// 1. Configure MSW handlers for API mocking in the project setup
// 2. Set up test database with sample drill data
// 3. Configure proper test environment variables
// 4. Verify API endpoint configurations match the test setup

const setupTest = () => {
  // Requirement: System Performance - Test environment setup for performance monitoring
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // Requirement: Practice Drills - Mock data for comprehensive drill testing
  const mockDrills: DrillPrompt[] = [
    {
      id: '1',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.BEGINNER,
      title: 'Market Entry Strategy',
      description: 'Analyze market entry options for a European retailer',
      timeLimit: 15,
      industry: 'Retail',
      requiredTier: 'FREE'
    },
    {
      id: '2',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.INTERMEDIATE,
      title: 'Profitability Analysis',
      description: 'Evaluate profit improvement opportunities',
      timeLimit: 20,
      industry: 'Manufacturing',
      requiredTier: 'BASIC'
    }
  ];

  return { wrapper, queryClient, mockDrills };
};

describe('useDrill hook', () => {
  const mockDrillResponse = (drillType: DrillType): DrillResponse => ({
    success: true,
    data: [
      {
        id: '1',
        type: drillType,
        difficulty: DrillDifficulty.BEGINNER,
        title: 'Test Drill',
        description: 'Test Description',
        timeLimit: 15,
        industry: 'Technology',
        requiredTier: 'FREE'
      }
    ],
    error: null
  });

  beforeEach(() => {
    // Reset mocks and clear cache before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.resetAllMocks();
  });

  // Requirement: Practice Drills - Validates drill fetching functionality
  it('should fetch drills successfully', async () => {
    const { wrapper } = setupTest();
    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Verify initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.drills).toHaveLength(0);

    // Wait for drills to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify loaded drills
    expect(result.current.drills).toBeDefined();
    expect(Array.isArray(result.current.drills)).toBe(true);
    expect(result.current.error).toBeNull();
  });

  // Requirement: System Performance - Validates error handling and response time
  it('should handle API errors gracefully', async () => {
    const { wrapper } = setupTest();
    const errorMessage = 'Failed to fetch drills';

    // Mock API error response
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.drills).toHaveLength(0);
  });

  // Requirement: Practice Drills - Tests drill attempt submission
  it('should submit drill attempt successfully', async () => {
    const { wrapper } = setupTest();
    const mockAttempt: Partial<DrillAttempt> = {
      promptId: '1',
      response: 'Test response',
      timeSpent: 300
    };

    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Submit attempt and measure response time
    const startTime = performance.now();
    await act(async () => {
      await result.current.submitAttempt(
        mockAttempt.promptId!,
        mockAttempt.response!,
        mockAttempt.timeSpent!
      );
    });
    const endTime = performance.now();

    // Requirement: System Performance - Verify response time under 200ms
    expect(endTime - startTime).toBeLessThan(200);
    expect(result.current.error).toBeNull();
  });

  // Requirement: User Management - Tests progress tracking functionality
  it('should track drill progress correctly', async () => {
    const { wrapper } = setupTest();
    const mockProgress: DrillProgress = {
      drillType: DrillType.CASE_PROMPT,
      attemptsCount: 5,
      averageScore: 85,
      bestScore: 95,
      lastAttemptDate: new Date()
    };

    // Mock progress data
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockProgress, error: null }),
        ok: true
      } as Response)
    );

    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progress).toBeDefined();
    expect(result.current.progress.drillType).toBe(DrillType.CASE_PROMPT);
    expect(result.current.progress.attemptsCount).toBe(mockProgress.attemptsCount);
    expect(result.current.progress.averageScore).toBe(mockProgress.averageScore);
    expect(result.current.progress.bestScore).toBe(mockProgress.bestScore);
  });
});
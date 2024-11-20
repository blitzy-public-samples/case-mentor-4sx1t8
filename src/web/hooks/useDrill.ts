// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// @tanstack/react-query ^4.0.0
import { useQuery, useMutation } from '@tanstack/react-query';

// Internal imports
import {
  DrillType,
  DrillPrompt,
  DrillAttempt,
  DrillProgress,
  DrillResponse,
  DrillFeedback,
  DrillDifficulty
} from '../types/drills';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

/**
 * Human Tasks:
 * 1. Configure proper cache invalidation rules in react-query for drill updates
 * 2. Set up monitoring for drill attempt submission performance
 * 3. Verify proper error tracking integration for failed attempts
 * 4. Configure proper retry strategies for API calls
 */

// Requirement: Practice Drills - Implements drill management functionality
export function useDrill(drillType: DrillType) {
  const { state: authState } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Requirement: System Performance - Ensures drill operations maintain <200ms API response time
  const {
    data: drills,
    isLoading: loading,
    refetch: refetchDrills
  } = useQuery<DrillPrompt[]>(
    ['drills', drillType],
    () => fetchDrills(drillType),
    {
      enabled: !!authState.user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  // Requirement: User Management - Handles progress tracking
  const {
    data: progress,
    isLoading: progressLoading,
    refetch: refetchProgress
  } = useQuery<DrillProgress>(
    ['drillProgress', drillType],
    () => getDrillProgress(drillType),
    {
      enabled: !!authState.user,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: 2,
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  // Requirement: Practice Drills - Implements comprehensive drill management
  const submitAttemptMutation = useMutation<
    DrillResponse,
    Error,
    { promptId: string; response: string; timeSpent: number }
  >(
    ({ promptId, response, timeSpent }) =>
      submitDrillAttempt(promptId, response, timeSpent),
    {
      onSuccess: async () => {
        await Promise.all([refetchDrills(), refetchProgress()]);
      },
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  // Requirement: Practice Drills - Fetches available drills based on type
  const fetchDrills = async (type: DrillType): Promise<DrillPrompt[]> => {
    if (!authState.user) {
      throw new Error('User must be authenticated to fetch drills');
    }

    const response = await api.get<DrillResponse>(`/api/drills/${type}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch drills');
    }

    return response.data as DrillPrompt[];
  };

  // Requirement: User Management - Handles progress tracking and performance analytics
  const getDrillProgress = async (type: DrillType): Promise<DrillProgress> => {
    if (!authState.user) {
      throw new Error('User must be authenticated to fetch progress');
    }

    const response = await api.get<DrillResponse>(`/api/drills/${type}/progress`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch progress');
    }

    return response.data as DrillProgress;
  };

  // Requirement: Practice Drills - Submits attempts with proper error handling
  const submitDrillAttempt = async (
    promptId: string,
    response: string,
    timeSpent: number
  ): Promise<DrillResponse> => {
    if (!authState.user) {
      throw new Error('User must be authenticated to submit attempt');
    }

    const attempt: Partial<DrillAttempt> = {
      promptId,
      response,
      timeSpent,
      userId: authState.user.id,
      createdAt: new Date()
    };

    const apiResponse = await api.post<DrillResponse>('/api/drills/attempt', attempt);
    if (!apiResponse.success) {
      throw new Error(apiResponse.error?.message || 'Failed to submit attempt');
    }

    return apiResponse;
  };

  // Cleanup function for subscriptions
  useEffect(() => {
    return () => {
      // Cleanup any subscriptions if needed
    };
  }, []);

  // Expose drill management functionality with proper typing
  return {
    drills: drills || [],
    loading: loading || progressLoading,
    error,
    submitAttempt: useCallback(
      (promptId: string, response: string, timeSpent: number) =>
        submitAttemptMutation.mutateAsync({ promptId, response, timeSpent }),
      [submitAttemptMutation]
    ),
    progress: progress || {
      drillType,
      attemptsCount: 0,
      averageScore: 0,
      bestScore: 0,
      lastAttemptDate: new Date()
    }
  };
}
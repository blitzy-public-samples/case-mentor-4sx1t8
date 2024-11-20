// react version: ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// swr version: ^2.0.0
import useSWR from 'swr';

import type {
  DrillTemplate,
  DrillAttempt,
  DrillType,
  DrillDifficulty,
  DrillStatus,
  DrillAPIResponse
} from '../types/drills';
import { apiClient } from '../lib/api-client';
import { useAuth } from './use-auth';

// Human Tasks:
// 1. Configure API rate limiting for drill endpoints
// 2. Set up monitoring for drill completion metrics
// 3. Configure caching rules for drill templates
// 4. Set up analytics tracking for drill performance

interface DrillsState {
  availableDrills: DrillTemplate[];
  userAttempts: DrillAttempt[];
  loading: boolean;
  error: Error | null;
}

interface DrillFilters {
  type: DrillType | null;
  difficulty: DrillDifficulty | null;
}

/**
 * @requirement Practice Drills
 * Fetches available drills based on provided filters
 */
const fetchDrills = async (filters: DrillFilters): Promise<DrillTemplate[]> => {
  const queryParams = {
    ...(filters.type && { type: filters.type }),
    ...(filters.difficulty && { difficulty: filters.difficulty })
  };

  const response = await apiClient.get<DrillAPIResponse<DrillTemplate[]>>('/api/drills', queryParams);
  
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch drills');
  }

  return response.data;
};

/**
 * @requirement User Management
 * Fetches user's drill attempts and progress
 */
const fetchUserAttempts = async (userId: string): Promise<DrillAttempt[]> => {
  const response = await apiClient.get<DrillAPIResponse<DrillAttempt[]>>(`/api/users/${userId}/drill-attempts`);
  
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch user attempts');
  }

  return response.data;
};

/**
 * @requirement Practice Drills, User Management
 * Custom React hook for managing drills state and interactions
 */
export function useDrills(filters: DrillFilters) {
  const { authState } = useAuth();
  const userId = authState.user?.id;

  // Fetch drills with SWR for caching and revalidation
  const { 
    data: drills, 
    error: drillsError,
    mutate: mutateDrills 
  } = useSWR(
    ['drills', filters],
    () => fetchDrills(filters),
    { revalidateOnFocus: false }
  );

  // Fetch user attempts
  const {
    data: userAttempts,
    error: attemptsError,
    mutate: mutateAttempts
  } = useSWR(
    userId ? ['attempts', userId] : null,
    () => userId ? fetchUserAttempts(userId) : null,
    { revalidateOnFocus: false }
  );

  /**
   * @requirement Practice Drills
   * Starts a new drill attempt
   */
  const startDrill = useCallback(async (drillId: string): Promise<DrillAttempt> => {
    if (!userId) throw new Error('User must be authenticated');

    const response = await apiClient.post<DrillAPIResponse<DrillAttempt>>('/api/drill-attempts', {
      drillId,
      userId,
      status: 'IN_PROGRESS' as DrillStatus
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to start drill');
    }

    // Update local attempts cache
    await mutateAttempts();
    return response.data;
  }, [userId, mutateAttempts]);

  /**
   * @requirement Practice Drills, User Management
   * Submits a drill attempt with user response
   */
  const submitDrillAttempt = useCallback(async (
    attemptId: string,
    response: Record<string, any>
  ): Promise<DrillAttempt> => {
    const apiResponse = await apiClient.post<DrillAPIResponse<DrillAttempt>>(
      `/api/drill-attempts/${attemptId}/submit`,
      { response }
    );

    if (!apiResponse.success) {
      throw new Error(apiResponse.error?.message || 'Failed to submit drill attempt');
    }

    // Update local attempts cache
    await mutateAttempts();
    return apiResponse.data;
  }, [mutateAttempts]);

  /**
   * @requirement Practice Drills
   * Abandons an in-progress drill attempt
   */
  const abandonDrill = useCallback(async (attemptId: string): Promise<void> => {
    const response = await apiClient.post<DrillAPIResponse<void>>(
      `/api/drill-attempts/${attemptId}/abandon`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to abandon drill');
    }

    // Update local attempts cache
    await mutateAttempts();
  }, [mutateAttempts]);

  // Combine loading states
  const loading = !drills || (userId && !userAttempts);

  // Combine errors
  const error = drillsError || attemptsError || null;

  return {
    drills: drills || [],
    userAttempts: userAttempts || [],
    loading,
    error,
    startDrill,
    submitDrillAttempt,
    abandonDrill
  };
}
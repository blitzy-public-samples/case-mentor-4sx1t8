// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// swr ^2.0.0
import useSWR from 'swr';

import { api } from '../lib/api';
import { UserProgress } from '../types/user';
import { APIResponse, APIError } from '../types/api';

/**
 * Human Tasks:
 * 1. Configure SWR cache persistence strategy in production
 * 2. Set up monitoring for progress data fetch performance
 * 3. Configure proper error tracking for failed progress updates
 */

// Cache time for progress data (5 minutes)
const CACHE_TIME = 300000;

// Progress endpoint URL template
const PROGRESS_ENDPOINT = '/api/users/${userId}/progress';

/**
 * Custom hook for fetching and managing user progress data with automatic revalidation.
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * for user practice activities
 * 
 * @param userId - The ID of the user whose progress to fetch
 */
export function useProgress(userId: string) {
  // Construct the progress endpoint URL
  const progressUrl = PROGRESS_ENDPOINT.replace('${userId}', userId);

  // Define the data fetcher function for SWR
  const fetcher = async (url: string): Promise<UserProgress> => {
    const response: APIResponse<UserProgress> = await api.get(url);
    
    if (!response.success || !response.data) {
      throw response.error || new Error('Failed to fetch progress data');
    }

    // Ensure dates are properly parsed
    return {
      ...response.data,
      lastUpdated: new Date(response.data.lastUpdated)
    };
  };

  // Initialize SWR hook with caching and revalidation
  const {
    data: progress,
    error,
    isLoading,
    mutate
  } = useSWR<UserProgress, APIError>(
    progressUrl,
    fetcher,
    {
      dedupingInterval: CACHE_TIME,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Requirement: System Performance - Track and maintain >80% completion rate
      onError: (err) => {
        console.error('Progress data fetch failed:', err);
      },
      onSuccess: (data) => {
        // Validate drill completion rate
        if (data.drillsCompleted > 0 && data.drillsSuccessRate < 0.8) {
          console.warn('Drill completion rate below 80% threshold');
        }
      }
    }
  );

  // Return structured response with progress data, loading state, errors and mutate function
  return {
    progress: progress || null,
    isLoading,
    error: error || null,
    mutate: useCallback(async () => {
      await mutate();
    }, [mutate])
  };
}
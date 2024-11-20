// react v18.0.0
import { useState, useCallback, useEffect } from 'react';
// react-query v3.39.0
import { useQuery, useMutation } from 'react-query';

import { AIFeedback, FeedbackHistory, FeedbackResponse } from '../types/feedback';
import { api } from '../lib/api';
import { useToast, ToastType } from './useToast';

/**
 * Human Tasks:
 * 1. Configure react-query cache invalidation settings in QueryClientProvider
 * 2. Set up error tracking service integration for monitoring feedback failures
 * 3. Verify API rate limiting configuration for feedback endpoints
 */

// Query keys for react-query cache management
const FEEDBACK_KEYS = {
  feedback: (drillId: string) => ['feedback', drillId],
  history: (drillId: string) => ['feedback-history', drillId],
};

/**
 * Custom hook for managing AI-powered feedback for case interview practice
 * @requirement AI Evaluation - Core service for AI-powered feedback and evaluation with real-time updates and caching
 * @requirement Progress Tracking - Performance tracking and feedback management with historical data analysis
 */
export const useFeedback = (drillId: string) => {
  const toast = useToast();
  const [userId] = useState<string>(() => 
    // This should be replaced with actual user ID from auth context
    localStorage.getItem('userId') || ''
  );

  // Fetch feedback data with react-query
  const {
    data: feedback,
    isLoading: isFeedbackLoading,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery<AIFeedback | null, Error>(
    FEEDBACK_KEYS.feedback(drillId),
    () => getFeedback(drillId),
    {
      enabled: Boolean(drillId),
      staleTime: 30000, // Consider feedback data stale after 30 seconds
      cacheTime: 3600000, // Cache feedback data for 1 hour
      retry: 2,
      onError: (error) => {
        toast.show({
          type: ToastType.ERROR,
          message: `Failed to fetch feedback: ${error.message}`,
          duration: 5000
        });
      }
    }
  );

  // Fetch feedback history with react-query
  const {
    data: history,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory
  } = useQuery<FeedbackHistory | null, Error>(
    FEEDBACK_KEYS.history(drillId),
    () => getFeedbackHistory(userId, drillId),
    {
      enabled: Boolean(drillId) && Boolean(userId),
      staleTime: 300000, // Consider history stale after 5 minutes
      cacheTime: 3600000, // Cache history for 1 hour
      retry: 2,
      onError: (error) => {
        toast.show({
          type: ToastType.ERROR,
          message: `Failed to fetch feedback history: ${error.message}`,
          duration: 5000
        });
      }
    }
  );

  // Mutation for requesting new feedback
  const feedbackMutation = useMutation<FeedbackResponse, Error, void>(
    async () => {
      const response = await api.post<FeedbackResponse>('/feedback/request', {
        drillId,
        userId
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to request feedback');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Feedback request submitted successfully',
          duration: 3000
        });
        // Invalidate and refetch feedback data
        refetchFeedback();
      },
      onError: (error) => {
        toast.show({
          type: ToastType.ERROR,
          message: `Failed to request feedback: ${error.message}`,
          duration: 5000
        });
      }
    }
  );

  /**
   * Fetches feedback for a specific drill attempt
   * @requirement AI Evaluation - Core service for AI-powered feedback
   */
  const getFeedback = async (drillId: string): Promise<AIFeedback | null> => {
    const response = await api.get<AIFeedback>(`/feedback/${drillId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch feedback');
    }
    return response.data;
  };

  /**
   * Retrieves historical feedback with aggregated metrics
   * @requirement Progress Tracking - Historical performance analysis
   */
  const getFeedbackHistory = async (
    userId: string,
    drillId: string
  ): Promise<FeedbackHistory | null> => {
    const response = await api.get<FeedbackHistory>(
      `/feedback/history/${userId}`,
      { drillId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch feedback history');
    }
    return response.data;
  };

  /**
   * Requests new feedback for the current drill
   */
  const requestFeedback = useCallback(async () => {
    await feedbackMutation.mutateAsync();
  }, [feedbackMutation]);

  /**
   * Refreshes the feedback history
   */
  const refreshHistory = useCallback(async () => {
    await refetchHistory();
  }, [refetchHistory]);

  return {
    feedback,
    history,
    isLoading: isFeedbackLoading || isHistoryLoading || feedbackMutation.isLoading,
    error: feedbackError || historyError || feedbackMutation.error,
    requestFeedback,
    refreshHistory
  };
};
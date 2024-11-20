// React v18.0.0
'use client';
import React, { useCallback } from 'react';
// Next.js v13.0.0
import { useParams, useRouter } from 'next/navigation';

import { DrillAttemptForm, type DrillAttemptFormProps } from '../../../../components/drills/drill-attempt-form';
import { useDrills } from '../../../../hooks/use-drills';
import { useAuth } from '../../../../hooks/use-auth';

// Human Tasks:
// 1. Configure error tracking for drill attempt failures
// 2. Set up analytics for drill attempt completion rates
// 3. Test drill attempt flow with different drill types
// 4. Verify timer synchronization across browser tabs

/**
 * @requirement Practice Drills - Enable users to attempt various types of case interview practice drills
 * @requirement User Management - Track user progress and performance through drill attempts
 */
export default function DrillAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { authState } = useAuth();
  const { drills, userAttempts, submitDrillAttempt, loading, error } = useDrills({
    type: null,
    difficulty: null
  });

  // Get the current drill ID from route params
  const drillId = params.id as string;

  // Find the current drill and its active attempt
  const currentDrill = drills.find(drill => drill.id === drillId);
  const activeAttempt = userAttempts.find(
    attempt => attempt.drillId === drillId && attempt.status === 'IN_PROGRESS'
  );

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-semibold text-red-600">Error Loading Drill</h1>
        <p className="text-gray-600 mt-2">{error.message}</p>
        <button
          onClick={() => router.push('/drills')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Return to Drills
        </button>
      </div>
    );
  }

  // Check authentication
  if (!authState.user) {
    router.push('/auth/login');
    return null;
  }

  // Handle drill not found
  if (!currentDrill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-semibold">Drill Not Found</h1>
        <p className="text-gray-600 mt-2">The requested drill could not be found.</p>
        <button
          onClick={() => router.push('/drills')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Browse Drills
        </button>
      </div>
    );
  }

  // Handle no active attempt
  if (!activeAttempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-semibold">No Active Attempt</h1>
        <p className="text-gray-600 mt-2">Please start a new attempt for this drill.</p>
        <button
          onClick={() => router.push(`/drills/${drillId}`)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Start New Attempt
        </button>
      </div>
    );
  }

  /**
   * @requirement Practice Drills - Handle drill attempt submission
   */
  const handleSubmitAttempt = useCallback(async (response: Record<string, any>) => {
    try {
      await submitDrillAttempt(activeAttempt.id, response);
      router.push(`/drills/${drillId}/feedback`);
    } catch (error) {
      console.error('Failed to submit drill attempt:', error);
      // Handle submission error (could add toast notification here)
    }
  }, [activeAttempt.id, drillId, router, submitDrillAttempt]);

  /**
   * @requirement Practice Drills - Handle drill time expiration
   */
  const handleTimeUp = useCallback(() => {
    handleSubmitAttempt({ timeUp: true });
  }, [handleSubmitAttempt]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DrillAttemptForm
        drill={currentDrill}
        attempt={activeAttempt}
        onSubmit={handleSubmitAttempt}
        onTimeUp={handleTimeUp}
        isSubmitting={false}
      />
    </div>
  );
}
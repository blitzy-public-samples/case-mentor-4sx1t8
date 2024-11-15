// react ^18.0.0
'use client';
import React from 'react';

// Internal imports
import ProgressChart from '../../../components/analytics/ProgressChart';
import ScoreDistribution from '../../../components/analytics/ScoreDistribution';
import SkillRadar from '../../../components/analytics/SkillRadar';
import { useProgress } from '../../../hooks/useProgress';
import { useAuth } from '../../../hooks/useAuth';
import { DrillType } from '../../../types/drills';

/**
 * Human Tasks:
 * 1. Configure monitoring for analytics data visualization performance
 * 2. Set up error tracking for analytics data loading failures
 * 3. Verify accessibility compliance for all chart components
 */

/**
 * Progress analytics dashboard page displaying comprehensive user performance metrics
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * for user practice activities with detailed metrics visualization
 * 
 * Requirement: System Performance - Track and maintain >80% completion rate
 * through visual feedback and analytics
 */
export default function ProgressPage() {
  // Get authenticated user data
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  // Fetch user progress data with SWR
  const { progress, isLoading, error } = useProgress(userId || '');

  if (!authState.authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center text-gray-600">
          Please sign in to view your progress
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Error Loading Progress Data</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Progress Overview Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Progress Overview</h2>
        <ProgressChart
          userId={userId || ''}
          height="400px"
          className="w-full bg-white rounded-lg shadow-sm"
        />
      </section>

      {/* Performance Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Distribution Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Performance Analysis</h2>
          <ScoreDistribution
            drillType={DrillType.CASE_PROMPT}
            className="h-[300px] bg-white rounded-lg shadow-sm"
          />
        </section>

        {/* Skill Assessment Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Skill Assessment</h2>
          <SkillRadar
            userId={userId || ''}
            className="h-[300px] bg-white rounded-lg shadow-sm"
          />
        </section>
      </div>

      {/* Performance Summary */}
      {progress && (
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Total Drills</p>
              <p className="text-2xl font-bold">{progress.drillsCompleted}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">
                {Math.round(progress.drillsSuccessRate * 100)}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">
                {Math.round(progress.averageScore)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Best Score</p>
              <p className="text-2xl font-bold">
                {Math.round(progress.bestScore)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
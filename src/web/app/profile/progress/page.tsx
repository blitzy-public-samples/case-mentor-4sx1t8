// react version: ^18.0.0
'use client';

import React, { useMemo } from 'react';
// class-variance-authority version: ^1.0.0
import { cn } from 'class-variance-authority';
import { redirect } from 'next/navigation';

import ProgressChart from '@/components/profile/progress-chart';
import { useAuth } from '@/hooks/use-auth';
import { useDrills } from '@/hooks/use-drills';
import type { User } from '@/types/user';

// Human Tasks:
// 1. Configure monitoring for performance metrics visualization
// 2. Set up analytics tracking for user progress milestones
// 3. Review and adjust chart rendering optimization settings

/**
 * @requirement User Management - Progress tracking and performance analytics
 * NextJS page component for displaying user's case interview practice progress
 */
export default function ProgressPage(): JSX.Element {
  // Get authentication state and user session
  const { authState } = useAuth();
  
  // Get drill data and user attempts
  const { drills, userAttempts, loading, error } = useDrills({
    type: null,
    difficulty: null
  });

  // Redirect to login if user is not authenticated
  if (!authState.user) {
    redirect('/login');
  }

  // Calculate drill type completion metrics
  const drillMetrics = useMemo(() => {
    if (!drills?.length || !userAttempts?.length) return null;

    const metrics = drills.reduce((acc, drill) => {
      if (!acc[drill.type]) {
        acc[drill.type] = {
          total: 0,
          completed: 0,
          scores: [] as number[],
          attempts: 0
        };
      }
      acc[drill.type].total += 1;
      return acc;
    }, {} as Record<string, {
      total: number;
      completed: number;
      scores: number[];
      attempts: number;
    }>);

    // Process user attempts
    userAttempts.forEach(attempt => {
      const drill = drills.find(d => d.id === attempt.drillId);
      if (drill) {
        metrics[drill.type].attempts += 1;
        if (attempt.status === 'COMPLETED') {
          metrics[drill.type].completed += 1;
          if (attempt.score !== null) {
            metrics[drill.type].scores.push(attempt.score);
          }
        }
      }
    });

    return metrics;
  }, [drills, userAttempts]);

  // Calculate improvement areas based on performance
  const improvementAreas = useMemo(() => {
    if (!drillMetrics) return [];

    return Object.entries(drillMetrics)
      .filter(([_, data]) => {
        const avgScore = data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;
        return avgScore < 70 || data.completed / data.total < 0.5;
      })
      .map(([type]) => type);
  }, [drillMetrics]);

  // Calculate strength areas based on performance
  const strengthAreas = useMemo(() => {
    if (!drillMetrics) return [];

    return Object.entries(drillMetrics)
      .filter(([_, data]) => {
        const avgScore = data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;
        return avgScore >= 85 && data.completed / data.total >= 0.7;
      })
      .map(([type]) => type);
  }, [drillMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Progress</h2>
          <p>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Get all unique drill types
  const drillTypes = useMemo(() => {
    if (!drills?.length) return [];
    return Array.from(new Set(drills.map(drill => drill.type)));
  }, [drills]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Requirement: User Management - Progress tracking and performance analytics */}
      <h1 className="text-3xl font-bold mb-8">Practice Progress</h1>

      {/* Progress visualization */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ProgressChart
            className="w-full"
            drillTypes={drillTypes}
            showLegend={true}
          />
        </div>
      </div>

      {/* Drill type specific metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {drillMetrics && Object.entries(drillMetrics).map(([type, data]) => {
          const completionRate = (data.completed / data.total) * 100;
          const avgScore = data.scores.length > 0
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            : 0;

          return (
            <div
              key={type}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold mb-4">
                {type.replace(/_/g, ' ')}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.completed}/{data.total} completed ({Math.round(completionRate)}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round(avgScore)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                  <p className="text-lg">{data.attempts}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement areas and recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Areas for Improvement</h2>
          <ul className="space-y-2">
            {improvementAreas.map(area => (
              <li key={area} className="flex items-center text-red-600">
                <span className="mr-2">•</span>
                {area.replace(/_/g, ' ')}
              </li>
            ))}
            {improvementAreas.length === 0 && (
              <li className="text-gray-600">
                Great work! Keep maintaining your performance.
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Strength Areas</h2>
          <ul className="space-y-2">
            {strengthAreas.map(area => (
              <li key={area} className="flex items-center text-green-600">
                <span className="mr-2">•</span>
                {area.replace(/_/g, ' ')}
              </li>
            ))}
            {strengthAreas.length === 0 && (
              <li className="text-gray-600">
                Keep practicing to develop your strengths!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
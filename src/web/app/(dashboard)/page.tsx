// react ^18.0.0
'use client';
import React from 'react';
// date-fns ^2.30.0
import { format } from 'date-fns';

// Internal imports with relative paths
import ProgressChart from '../../components/analytics/ProgressChart';
import DrillCard from '../../components/drills/DrillCard';
import SimulationCard from '../../components/simulation/SimulationCard';
import PlanCard from '../../components/subscription/PlanCard';
import { useAuth } from '../../hooks/useAuth';
import { useDrill } from '../../hooks/useDrill';
import { useSimulation } from '../../hooks/useSimulation';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate analytics tracking implementation
 */

// Helper function to format recent activity
const getRecentActivity = (attempts: DrillAttempt[]): Array<{date: string, type: string, score: number}> => {
  return attempts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map(attempt => ({
      date: format(attempt.createdAt, 'MMM d, yyyy'),
      type: attempt.drillType,
      score: attempt.score
    }));
};

// Requirement: User Management - Profile customization, progress tracking, and performance analytics
const Dashboard = (): JSX.Element => {
  // Get authenticated user data
  const { state: authState } = useAuth();
  
  // Fetch drill data and progress
  const { drills, loading: drillsLoading, progress, error: drillError } = useDrill();
  
  // Get simulation state
  const { 
    simulationState, 
    loading: simulationLoading, 
    error: simulationError 
  } = useSimulation();

  // Early return for loading state
  if (!authState.user || drillsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <main 
      className="container mx-auto px-4 py-8 space-y-8"
      role="main"
      aria-label="Dashboard"
    >
      {/* Requirement: User Management - Welcome section with user info */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {authState.user.name}
          </h1>
          <span className="text-sm text-gray-600">
            Last login: {format(authState.user.lastLogin, 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        {/* Requirement: System Performance - Track completion rates */}
        <ProgressChart
          userId={authState.user.id}
          height="300px"
          className="bg-white rounded-lg shadow-md p-4"
        />
      </section>

      {/* Requirement: Core Features - Quick access to practice drills */}
      <section 
        className="space-y-4"
        aria-labelledby="practice-drills-heading"
      >
        <h2 
          id="practice-drills-heading"
          className="text-2xl font-semibold text-gray-900"
        >
          Practice Drills
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drills.slice(0, 3).map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              progress={progress[drill.id]}
              onStart={() => {/* Handle drill start */}}
              className="h-full"
            />
          ))}
        </div>
      </section>

      {/* Requirement: Core Features - McKinsey simulation status */}
      {simulationState && (
        <section 
          className="space-y-4"
          aria-labelledby="simulation-heading"
        >
          <h2 
            id="simulation-heading"
            className="text-2xl font-semibold text-gray-900"
          >
            Active Simulation
          </h2>
          <SimulationCard
            simulation={simulationState}
            loading={simulationLoading}
            className="bg-white rounded-lg shadow-md"
          />
        </section>
      )}

      {/* Requirement: Core Features - Subscription management */}
      <section 
        className="space-y-4"
        aria-labelledby="subscription-heading"
      >
        <h2 
          id="subscription-heading"
          className="text-2xl font-semibold text-gray-900"
        >
          Your Subscription
        </h2>
        <PlanCard
          plan={authState.user.subscription}
          isSelected={true}
          isLoading={false}
          onSelect={() => {/* Handle plan selection */}}
        />
      </section>

      {/* Error handling section */}
      {(drillError || simulationError) && (
        <div 
          className="bg-red-50 border border-red-200 rounded-md p-4 mt-4"
          role="alert"
        >
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">
            {drillError || simulationError}
          </p>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
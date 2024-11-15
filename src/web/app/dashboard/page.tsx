// react version: ^18.0.0

import React from 'react';
import { Metadata } from 'next';
import { DrillProgress, DrillProgressProps } from '../../components/drills/drill-progress';
import { ResultsChart } from '../../components/simulation/results-chart';
import { useAuth } from '../../hooks/use-auth';
import { Card } from '@/components/ui/card';

// Human Tasks:
// 1. Configure monitoring for dashboard performance metrics
// 2. Set up error boundaries for component failures
// 3. Implement data prefetching strategy for optimal loading
// 4. Configure proper caching headers for static assets

interface DashboardData {
  drillProgress: DrillProgressStats[];
  recentActivity: DrillAttempt[];
  simulationResults: SimulationConfig | null;
  interviewCountdown: number;
}

/**
 * @requirement User Management - Progress tracking and performance analytics
 * Server component that renders the user dashboard page with progress tracking
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const { authState } = useAuth();

  // Verify user authentication
  if (!authState.user) {
    redirect('/auth/login');
  }

  // Fetch user's drill progress data
  const dashboardData: DashboardData = await fetch(
    `/api/dashboard/${authState.user.id}`,
    {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Authorization': `Bearer ${authState.session?.access_token}`
      }
    }
  ).then(res => res.json());

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(Date.now() + (dashboardData.interviewCountdown * 24 * 60 * 60 * 1000));

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {authState.user.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Your interview is scheduled for {formattedDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Days until interview</p>
            <p className="text-3xl font-bold text-primary">
              {dashboardData.interviewCountdown}
            </p>
          </div>
        </div>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Drill Progress Section */}
        <section aria-labelledby="drill-progress-heading">
          <h2 id="drill-progress-heading" className="sr-only">
            Drill Progress
          </h2>
          <DrillProgress 
            className="h-full"
            showDetailed={true}
          />
        </section>

        {/* Recent Activity Section */}
        <section aria-labelledby="recent-activity-heading">
          <Card className="h-full p-6">
            <h2 id="recent-activity-heading" className="text-xl font-semibold mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {activity.drillType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Score: {activity.score}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Time: {Math.round(activity.timeSpent / 60)}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* Simulation Results Section */}
      {dashboardData.simulationResults && (
        <section aria-labelledby="simulation-results-heading" className="mb-8">
          <Card className="p-6">
            <h2 id="simulation-results-heading" className="text-xl font-semibold mb-6">
              McKinsey Simulation Results
            </h2>
            <ResultsChart
              simulationId={dashboardData.simulationResults.id}
              config={dashboardData.simulationResults}
              showLegend={true}
              className="h-[400px]"
            />
          </Card>
        </section>
      )}
    </main>
  );
}

/**
 * @requirement Core Features - Integration of practice drills and McKinsey simulation tracking
 * Generates metadata for the dashboard page following NextJS conventions
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard | Case Interview Practice Platform',
    description: 'Track your case interview practice progress, recent drill attempts, and simulation performance.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Case Interview Practice Dashboard',
      description: 'Track your progress and prepare for your consulting interview.',
      type: 'website',
      images: [
        {
          url: '/images/dashboard-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Case Interview Practice Dashboard'
        }
      ]
    }
  };
}
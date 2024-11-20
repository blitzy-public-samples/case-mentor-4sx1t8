// @package react ^18.0.0
// @package next ^13.0.0

// Human Tasks:
// 1. Verify WCAG 2.1 AA compliance for all interactive elements
// 2. Test screen reader announcements for drill status changes
// 3. Validate keyboard navigation flow
// 4. Configure analytics tracking for drill interactions

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { DrillCard, type DrillCardProps } from '../../../components/drills/drill-card';
import { DrillProgress, type DrillProgressProps } from '../../../components/drills/drill-progress';
import { useDrills } from '../../../hooks/use-drills';

// Requirement: Practice Drills - Server component function to fetch drill details
async function getDrillDetails(drillId: string) {
  try {
    const response = await fetch(`/api/drills/${drillId}`, {
      next: { revalidate: 60 } // Cache for 60 seconds per metadata
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drill details:', error);
    return null;
  }
}

// Requirement: Practice Drills - Page component interface
interface DrillPageProps {
  params: {
    id: string;
  };
}

// Requirement: Practice Drills - Detailed drill view component
export default async function DrillPage({ params }: DrillPageProps) {
  // Fetch drill details
  const drillDetails = await getDrillDetails(params.id);
  
  if (!drillDetails) {
    notFound();
  }

  // Client component wrapper for interactive elements
  const DrillInteractions = () => {
    const { drills, userAttempts, startDrill } = useDrills({
      type: drillDetails.type,
      difficulty: drillDetails.difficulty
    });

    // Find current drill and its attempts
    const currentDrill = drills.find(d => d.id === params.id);
    const drillAttempts = userAttempts.filter(a => a.drillId === params.id);
    
    if (!currentDrill) {
      return null;
    }

    // Calculate drill status and score
    const latestAttempt = drillAttempts[drillAttempts.length - 1];
    const status = latestAttempt?.status || 'NOT_STARTED';
    const score = latestAttempt?.score || null;

    // Requirement: Practice Drills - Handle drill start/resume
    const handleStartDrill = async () => {
      try {
        const attempt = await startDrill(params.id);
        window.location.href = `/drills/${params.id}/attempts/${attempt.id}`;
      } catch (error) {
        console.error('Error starting drill:', error);
        // Toast notification would be handled by global error boundary
      }
    };

    // Requirement: Practice Drills - Handle drill resume
    const handleResumeDrill = () => {
      if (latestAttempt && latestAttempt.status === 'IN_PROGRESS') {
        window.location.href = `/drills/${params.id}/attempts/${latestAttempt.id}`;
      }
    };

    return (
      <div className="space-y-8">
        {/* Requirement: Design System Implementation - Core design system tokens */}
        <section 
          className="bg-white rounded-lg shadow-md p-6"
          aria-labelledby="drill-details-heading"
        >
          <h1 
            id="drill-details-heading"
            className="text-2xl font-semibold text-gray-900 mb-6"
          >
            {currentDrill.title}
          </h1>

          <DrillCard
            drill={currentDrill}
            status={status}
            score={score}
            onStart={handleStartDrill}
            onResume={handleResumeDrill}
            className="mb-8"
          />
        </section>

        {/* Requirement: User Management - Show individual drill progress */}
        <section 
          className="bg-white rounded-lg shadow-md p-6"
          aria-labelledby="drill-progress-heading"
        >
          <h2 
            id="drill-progress-heading"
            className="text-xl font-semibold text-gray-900 mb-6"
          >
            Your Progress
          </h2>

          <DrillProgress
            showDetailed={true}
            className="w-full"
          />
        </section>
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <DrillInteractions />
    </main>
  );
}
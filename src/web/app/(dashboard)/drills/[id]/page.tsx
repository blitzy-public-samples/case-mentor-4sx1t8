'use client';

// react ^18.0.0
import { useState, useEffect } from 'react';
// next/navigation ^13.0.0
import { useParams, useRouter } from 'next/navigation';
// @tanstack/react-query ^4.0.0
import { useQuery } from '@tanstack/react-query';

// Internal imports
import { DrillTimer } from '../../../../components/drills/DrillTimer';
import { DrillCard } from '../../../../components/drills/DrillCard';
import { BrainstormingDrill } from '../../../../components/drills/BrainstormingDrill';
import { useDrill } from '../../../../hooks/useDrill';
import { DrillType, DrillAttempt, DrillPrompt } from '../../../../types/drills';

/**
 * Human Tasks:
 * 1. Verify proper analytics integration for drill completion tracking
 * 2. Test screen reader compatibility across different drill types
 * 3. Validate timer behavior during browser tab switching
 * 4. Configure proper error tracking for failed submissions
 */

// Constants for drill configuration
const DRILL_TYPE_COMPONENTS = {
  [DrillType.BRAINSTORMING]: BrainstormingDrill,
  // Additional drill type components will be added here
} as const;

const MIN_ATTEMPT_DURATION = 30; // 30 seconds minimum
const MAX_ATTEMPT_DURATION = 1800; // 30 minutes maximum

// Requirement: Practice Drills - Implements interactive interfaces for various drill types
const DrillPage = () => {
  const params = useParams();
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const drillId = params.id as string;

  // Requirement: System Performance - Efficient data fetching with caching
  const { drills, submitAttempt, progress, loading, error } = useDrill(DrillType.BRAINSTORMING);

  // Fetch specific drill data with caching
  const { data: drill } = useQuery<DrillPrompt>(
    ['drill', drillId],
    () => drills.find(d => d.id === drillId),
    {
      enabled: !!drillId && drills.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Requirement: Practice Drills - Handle drill completion with proper validation
  const handleDrillComplete = async (attempt: DrillAttempt) => {
    try {
      // Validate attempt duration
      if (attempt.timeSpent < MIN_ATTEMPT_DURATION) {
        throw new Error('Attempt duration too short');
      }
      if (attempt.timeSpent > MAX_ATTEMPT_DURATION) {
        throw new Error('Attempt duration too long');
      }

      // Submit attempt and handle response
      await submitAttempt(drill!.id, attempt.response, attempt.timeSpent);
      
      // Navigate to feedback view
      router.push(`/drills/${drillId}/feedback`);
    } catch (error) {
      console.error('Failed to submit drill attempt:', error);
      // Error handling would be implemented here
    }
  };

  // Requirement: Practice Drills - Get appropriate drill component based on type
  const getDrillComponent = (type: DrillType) => {
    const DrillComponent = DRILL_TYPE_COMPONENTS[type];
    if (!DrillComponent) {
      throw new Error(`Unsupported drill type: ${type}`);
    }
    return DrillComponent;
  };

  // Handle timer completion
  const handleTimeUp = () => {
    setIsStarted(false);
    router.push(`/drills/${drillId}/feedback?timeout=true`);
  };

  // Loading state
  if (loading || !drill) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading drill content"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen text-red-600"
        role="alert"
        aria-label="Error loading drill"
      >
        <p className="text-lg font-semibold">Failed to load drill</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Requirement: Accessibility - WCAG 2.1 AA compliant interface
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 
          className="text-2xl font-bold text-gray-900"
          id="drill-title"
        >
          {drill.title}
        </h1>
        <p 
          className="text-gray-600 mt-2"
          id="drill-description"
        >
          {drill.description}
        </p>
      </header>

      {!isStarted ? (
        // Requirement: User Management - Display drill information with progress
        <DrillCard
          drill={drill}
          progress={progress}
          onStart={() => setIsStarted(true)}
          className="w-full"
        />
      ) : (
        <div className="space-y-6">
          {/* Requirement: Practice Drills - Timer with visual indicators */}
          <DrillTimer
            duration={drill.timeLimit * 60}
            drillId={drill.id}
            onTimeUp={handleTimeUp}
          />

          {/* Requirement: Practice Drills - Dynamic drill interface */}
          {(() => {
            const DrillComponent = getDrillComponent(drill.type);
            return (
              <DrillComponent
                prompt={drill}
                onComplete={handleDrillComplete}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DrillPage;
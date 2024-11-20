// @package next ^13.0.0
// @package react ^18.0.0

// Human Tasks:
// 1. Test screen reader compatibility with feedback sections
// 2. Verify loading states with slow network conditions
// 3. Test keyboard navigation through feedback content
// 4. Validate error state handling with API failures

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { DrillFeedback, type DrillFeedbackProps } from '../../../../components/drills/drill-feedback';
import { useDrills } from '../../../../hooks/use-drills';
import { apiClient } from '../../../../lib/api-client';

// Requirement: Practice Drills - Display detailed feedback and evaluation for completed drill attempts
interface PageProps {
  params: {
    id: string;
  };
}

// Requirement: Practice Drills - Support performance analytics through detailed drill feedback visualization
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Drill Feedback',
    description: 'Comprehensive AI-generated feedback and evaluation for your case interview practice drill attempt',
    robots: {
      index: false, // Don't index individual feedback pages
      follow: true
    }
  };
}

// Requirement: Practice Drills - Display detailed feedback and evaluation for completed drill attempts
export default async function FeedbackPage({ params }: PageProps): Promise<JSX.Element> {
  // Validate attempt exists and is completed
  const { userAttempts } = useDrills({ type: null, difficulty: null });
  const attempt = userAttempts.find(a => a.id === params.id);

  if (!attempt || !attempt.feedback) {
    notFound();
  }

  // Requirement: User Management - Support performance analytics through detailed drill feedback visualization
  return (
    <main 
      className="container mx-auto px-4 py-8"
      role="main"
      aria-label="Drill feedback details"
    >
      <Suspense
        fallback={
          <div 
            className="animate-pulse space-y-4"
            role="status"
            aria-label="Loading feedback"
          >
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        }
      >
        <DrillFeedback 
          attemptId={params.id}
          className="max-w-4xl mx-auto"
        />
      </Suspense>
    </main>
  );
}

// Force dynamic rendering to ensure latest feedback data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
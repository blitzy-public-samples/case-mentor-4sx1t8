// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards for feedback section themes
// 2. Test screen reader compatibility with feedback section landmarks
// 3. Validate feedback content rendering with large text blocks
// 4. Test keyboard navigation through feedback sections

import React, { useEffect, useState } from 'react';
import { cn } from 'class-variance-authority';

import type { DrillFeedback } from '../../types/drills';
import { Card } from '../common/card';
import { useDrills } from '../../hooks/use-drills';

// Requirement: Practice Drills - Display detailed feedback with comprehensive assessment criteria
interface DrillFeedbackProps {
  attemptId: string;
  className?: string;
}

// Requirement: Practice Drills - Themed feedback sections following design system
const feedbackSectionVariants = {
  overall: 'bg-blue-50 p-6 rounded-lg',
  criteria: 'bg-white p-6 border border-gray-200 rounded-lg',
  improvement: 'bg-amber-50 p-6 rounded-lg',
  strengths: 'bg-green-50 p-6 rounded-lg'
} as const;

// Requirement: Practice Drills - Display detailed feedback and evaluation for completed drill attempts
export const DrillFeedback: React.FC<DrillFeedbackProps> = ({ attemptId, className }) => {
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { userAttempts } = useDrills({ type: null, difficulty: null });

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const attempt = userAttempts.find(a => a.id === attemptId);
        if (!attempt?.feedback) {
          throw new Error('Feedback not found for this attempt');
        }
        setFeedback(attempt.feedback as unknown as DrillFeedback);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (userAttempts.length > 0) {
      fetchFeedback();
    }
  }, [attemptId, userAttempts]);

  if (loading) {
    return (
      <div 
        className={cn("animate-pulse space-y-4", className)}
        role="status"
        aria-label="Loading feedback"
      >
        <Card className={feedbackSectionVariants.overall}>
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
          <div className="h-20 bg-blue-200 rounded mt-4"></div>
        </Card>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div 
        className={cn("text-red-600 p-4 bg-red-50 rounded-lg", className)}
        role="alert"
      >
        <h2 className="text-lg font-semibold">Error Loading Feedback</h2>
        <p>{error?.message || 'Unable to load feedback'}</p>
      </div>
    );
  }

  // Requirement: User Management - Support performance analytics through detailed visualization
  return (
    <div 
      className={cn("space-y-6", className)}
      role="region"
      aria-label="Drill attempt feedback"
    >
      {/* Overall Feedback Section */}
      <section aria-labelledby="overall-feedback">
        <Card className={feedbackSectionVariants.overall}>
          <h2 
            id="overall-feedback"
            className="text-xl font-semibold text-blue-900 mb-4"
          >
            Overall Assessment
          </h2>
          <p className="text-blue-800 whitespace-pre-wrap">
            {feedback.overallFeedback}
          </p>
        </Card>
      </section>

      {/* Criteria-specific Feedback */}
      <section 
        aria-labelledby="criteria-feedback"
        className="space-y-4"
      >
        <h2 
          id="criteria-feedback"
          className="text-xl font-semibold text-gray-900"
        >
          Evaluation Criteria
        </h2>
        {Object.entries(feedback.criteriaFeedback).map(([criteria, feedbackText]) => (
          <Card 
            key={criteria}
            className={feedbackSectionVariants.criteria}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {criteria}
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {feedbackText}
            </p>
            {feedback.detailedAnalysis[criteria] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Detailed Analysis
                </h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(feedback.detailedAnalysis[criteria], null, 2)}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </section>

      {/* Improvement Areas */}
      <section aria-labelledby="improvement-areas">
        <Card className={feedbackSectionVariants.improvement}>
          <h2 
            id="improvement-areas"
            className="text-xl font-semibold text-amber-900 mb-4"
          >
            Areas for Improvement
          </h2>
          <ul 
            className="list-disc list-inside space-y-2 text-amber-800"
            role="list"
          >
            {feedback.improvementAreas.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Strengths */}
      <section aria-labelledby="strengths">
        <Card className={feedbackSectionVariants.strengths}>
          <h2 
            id="strengths"
            className="text-xl font-semibold text-green-900 mb-4"
          >
            Key Strengths
          </h2>
          <ul 
            className="list-disc list-inside space-y-2 text-green-800"
            role="list"
          >
            {feedback.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};

export type { DrillFeedbackProps };
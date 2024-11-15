/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 minimum)
 * 2. Test with screen readers for proper ARIA label pronunciation
 * 3. Validate keyboard navigation flow through feedback sections
 */

// react v18.0.0
import * as React from 'react';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';

import { 
  FeedbackCategory, 
  FeedbackSeverity, 
  type AIFeedback as AIFeedbackType,
  type FeedbackPoint 
} from '../../../types/feedback';
import Card from '../../shared/Card';
import { useFeedback } from '../../../hooks/useFeedback';

interface AIFeedbackProps {
  drillId: string;
  className?: string;
}

// Requirement: AI Evaluation - Display AI-powered feedback and evaluation results
const AIFeedback: React.FC<AIFeedbackProps> = ({ drillId, className }) => {
  const { feedback, isLoading, error } = useFeedback(drillId);
  const [expandedSections, setExpandedSections] = React.useState<FeedbackCategory[]>([]);

  // Toggle section expansion state
  const toggleSection = (category: FeedbackCategory) => {
    setExpandedSections(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Requirement: AI Evaluation - Severity indicators and categorized insights
  const renderFeedbackPoint = (point: FeedbackPoint) => {
    const severityStyles = {
      [FeedbackSeverity.CRITICAL]: 'bg-red-100 border-red-500 text-red-900',
      [FeedbackSeverity.IMPORTANT]: 'bg-amber-100 border-amber-500 text-amber-900',
      [FeedbackSeverity.SUGGESTION]: 'bg-blue-100 border-blue-500 text-blue-900'
    };

    return (
      <div
        key={point.id}
        className={cn(
          'p-4 mb-3 rounded-lg border-l-4',
          severityStyles[point.severity]
        )}
        role="listitem"
        aria-label={`${point.severity.toLowerCase()} feedback point`}
      >
        <div className="flex items-start gap-2">
          {point.severity === FeedbackSeverity.CRITICAL && (
            <span className="sr-only">Critical feedback</span>
          )}
          <div>
            <p className="font-medium mb-2">{point.message}</p>
            {point.suggestion && (
              <p className="text-sm">
                <span className="font-medium">Suggestion: </span>
                {point.suggestion}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Requirement: Progress Tracking - Visual score indicators
  const renderScoreSection = () => {
    if (!feedback) return null;

    const scoreColor = feedback.overallScore >= 90 
      ? 'text-green-600' 
      : feedback.overallScore >= 70 
        ? 'text-blue-600' 
        : 'text-amber-600';

    return (
      <Card
        className="mb-6"
        aria-labelledby="score-heading"
      >
        <div className="flex items-center justify-between p-4">
          <h2 
            id="score-heading" 
            className="text-xl font-semibold"
          >
            Overall Score
          </h2>
          <div 
            className={cn(
              'flex items-center justify-center w-16 h-16 rounded-full border-4',
              scoreColor
            )}
            role="meter"
            aria-valuenow={feedback.overallScore}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="text-xl font-bold">
              {feedback.overallScore}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div 
        className={cn("p-4 text-center", className)}
        role="status"
        aria-label="Loading feedback"
      >
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <span className="sr-only">Loading feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={cn("p-4 bg-red-100 text-red-900 rounded-lg", className)}
        role="alert"
      >
        <p>Error loading feedback: {error.message}</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div 
        className={cn("p-4 bg-gray-100 text-gray-900 rounded-lg", className)}
        role="status"
      >
        <p>No feedback available yet.</p>
      </div>
    );
  }

  // Group feedback points by category
  const feedbackByCategory = feedback.feedbackPoints.reduce((acc, point) => {
    if (!acc[point.category]) {
      acc[point.category] = [];
    }
    acc[point.category].push(point);
    return acc;
  }, {} as Record<FeedbackCategory, FeedbackPoint[]>);

  return (
    <div className={cn("space-y-6", className)}>
      {renderScoreSection()}

      {/* Requirement: AI Evaluation - Categorized feedback display */}
      {Object.entries(feedbackByCategory).map(([category, points]) => (
        <Card
          key={category}
          className="overflow-hidden"
        >
          <button
            className="w-full p-4 text-left flex justify-between items-center"
            onClick={() => toggleSection(category as FeedbackCategory)}
            aria-expanded={expandedSections.includes(category as FeedbackCategory)}
            aria-controls={`feedback-${category}`}
          >
            <h3 className="text-lg font-semibold">
              {category}
            </h3>
            <span className="transform transition-transform duration-200">
              {expandedSections.includes(category as FeedbackCategory) ? '−' : '+'}
            </span>
          </button>
          
          <div
            id={`feedback-${category}`}
            className={cn(
              "transition-all duration-200",
              expandedSections.includes(category as FeedbackCategory)
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            )}
            role="region"
            aria-labelledby={`${category}-heading`}
          >
            <div className="p-4 pt-0">
              {points.map(renderFeedbackPoint)}
            </div>
          </div>
        </Card>
      ))}

      {/* Requirement: Progress Tracking - Strengths and improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Strengths</h3>
            <ul className="space-y-2" role="list">
              {feedback.strengths.map((strength, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="text-green-500">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Areas for Improvement</h3>
            <ul className="space-y-2" role="list">
              {feedback.improvements.map((improvement, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="text-amber-500">!</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIFeedback;
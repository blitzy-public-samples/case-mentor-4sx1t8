// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt, DrillFeedback } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import { DrillTimer } from './DrillTimer';

/**
 * Human Tasks:
 * 1. Verify AI evaluation endpoint is properly configured for case prompt responses
 * 2. Ensure proper error tracking is set up for failed submissions
 * 3. Test accessibility with screen readers and keyboard navigation
 */

// Constants for response validation
const MIN_RESPONSE_LENGTH = 100;
const MAX_RESPONSE_LENGTH = 5000;

interface CasePromptDrillProps {
  promptId: string;
  onComplete: (attempt: DrillAttempt) => void;
}

// Requirement: Case Prompt Drills - Implementation of case prompt practice functionality
export const CasePromptDrill = ({ promptId, onComplete }: CasePromptDrillProps): JSX.Element => {
  // Initialize drill state using custom hook
  const { drills, loading, error, submitAttempt } = useDrill(DrillType.CASE_PROMPT);
  
  // Local state management
  const [response, setResponse] = useState<string>('');
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Get current drill prompt
  const currentPrompt = drills.find(drill => drill.id === promptId);

  // Requirement: User Engagement - Clear error messaging and validation
  const validateResponse = useCallback((text: string): boolean => {
    if (text.length < MIN_RESPONSE_LENGTH) {
      setValidationError(`Response must be at least ${MIN_RESPONSE_LENGTH} characters`);
      return false;
    }
    if (text.length > MAX_RESPONSE_LENGTH) {
      setValidationError(`Response cannot exceed ${MAX_RESPONSE_LENGTH} characters`);
      return false;
    }
    setValidationError(null);
    return true;
  }, []);

  // Requirement: Case Prompt Drills - Handle response submission and evaluation
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateResponse(response)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAttempt(promptId, response, timeSpent);
      if (result.success && result.data) {
        const attemptData = result.data as DrillAttempt;
        setFeedback(attemptData.feedback);
        onComplete(attemptData);
      } else {
        throw new Error(result.error || 'Failed to submit attempt');
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, response, timeSpent, submitAttempt, validateResponse, onComplete]);

  // Handle timer completion
  const handleTimeUp = useCallback(() => {
    if (response.length > 0) {
      handleSubmit(new Event('submit') as any);
    }
  }, [response.length, handleSubmit]);

  // Requirement: User Interface Design - Implements consistent design system
  return (
    <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      ) : currentPrompt ? (
        <>
          {/* Timer Component */}
          <DrillTimer
            duration={currentPrompt.timeLimit * 60}
            drillId={promptId}
            onTimeUp={handleTimeUp}
            autoStart={true}
          />

          {/* Prompt Display */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{currentPrompt.title}</h2>
            <p className="text-muted-foreground">{currentPrompt.description}</p>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className={cn(
                  "w-full min-h-[300px] p-4 rounded-md border resize-y",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  validationError && "border-destructive"
                )}
                placeholder="Enter your response here..."
                disabled={isSubmitting}
                aria-label="Case response input"
              />
              <div className="flex justify-between text-sm">
                <span className={cn(
                  "text-muted-foreground",
                  response.length < MIN_RESPONSE_LENGTH && "text-destructive",
                  response.length > MAX_RESPONSE_LENGTH && "text-destructive"
                )}>
                  {response.length} / {MAX_RESPONSE_LENGTH} characters
                </span>
                {validationError && (
                  <span className="text-destructive">{validationError}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={cn(
                "px-6 py-2 rounded-md bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={isSubmitting || response.length < MIN_RESPONSE_LENGTH}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>

          {/* Feedback Display */}
          {feedback && (
            <div className="space-y-4 p-6 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold">Feedback</h3>
              <div className="space-y-2">
                <p className="text-lg">Score: {feedback.score}/100</p>
                <div>
                  <h4 className="font-medium text-success">Strengths:</h4>
                  <ul className="list-disc pl-6">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-warning">Areas for Improvement:</h4>
                  <ul className="list-disc pl-6">
                    {feedback.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          Drill prompt not found
        </div>
      )}
    </div>
  );
};
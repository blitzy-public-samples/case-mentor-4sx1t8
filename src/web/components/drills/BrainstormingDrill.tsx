// react ^18.0.0
import React, { useState, useCallback } from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import { Button, buttonVariants } from '../shared/Button';
import { DrillTimer } from './DrillTimer';

// Constants for drill configuration
const MIN_IDEAS_REQUIRED = 5;
const MAX_IDEAS_ALLOWED = 20;
const IDEA_INPUT_PLACEHOLDER = 'Enter your idea here...';
const MIN_IDEA_LENGTH = 5;
const MAX_IDEA_LENGTH = 200;

/**
 * Human Tasks:
 * 1. Verify proper error tracking integration for failed submissions
 * 2. Test timer behavior during browser tab switching
 * 3. Validate WCAG color contrast for error states
 * 4. Configure proper analytics for drill completion rates
 */

interface BrainstormingDrillProps {
  prompt: DrillPrompt;
  onComplete: (attempt: DrillAttempt) => void;
}

interface BrainstormingIdea {
  id: string;
  content: string;
  timestamp: Date;
}

// Requirement: Practice Drills - Implements Brainstorming Drills functionality
export const BrainstormingDrill: React.FC<BrainstormingDrillProps> = ({
  prompt,
  onComplete
}) => {
  const [ideas, setIdeas] = useState<BrainstormingIdea[]>([]);
  const [currentIdea, setCurrentIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitAttempt } = useDrill(DrillType.BRAINSTORMING);

  // Requirement: Practice Drills - Structured feedback system
  const handleAddIdea = useCallback(() => {
    setError(null);

    if (currentIdea.length < MIN_IDEA_LENGTH) {
      setError(`Ideas must be at least ${MIN_IDEA_LENGTH} characters long`);
      return;
    }

    if (currentIdea.length > MAX_IDEA_LENGTH) {
      setError(`Ideas cannot exceed ${MAX_IDEA_LENGTH} characters`);
      return;
    }

    if (ideas.length >= MAX_IDEAS_ALLOWED) {
      setError(`Maximum of ${MAX_IDEAS_ALLOWED} ideas allowed`);
      return;
    }

    const newIdea: BrainstormingIdea = {
      id: crypto.randomUUID(),
      content: currentIdea.trim(),
      timestamp: new Date()
    };

    setIdeas(prevIdeas => [...prevIdeas, newIdea]);
    setCurrentIdea('');
  }, [currentIdea, ideas.length]);

  // Requirement: User Management - Tracks user progress and performance
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (ideas.length < MIN_IDEAS_REQUIRED) {
      setError(`Please generate at least ${MIN_IDEAS_REQUIRED} ideas`);
      return;
    }

    try {
      setIsSubmitting(true);
      const attempt = await submitAttempt(
        prompt.id,
        JSON.stringify(ideas),
        prompt.timeLimit * 60 // Convert minutes to seconds
      );
      onComplete(attempt.data as DrillAttempt);
    } catch (err) {
      setError('Failed to submit drill attempt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [ideas, prompt, submitAttempt, onComplete]);

  const handleTimeUp = useCallback(() => {
    handleSubmit(new Event('submit') as React.FormEvent);
  }, [handleSubmit]);

  // Requirement: WCAG-compliant UI with proper form validation
  return (
    <div className="space-y-6">
      <DrillTimer
        duration={prompt.timeLimit * 60}
        drillId={prompt.id}
        onTimeUp={handleTimeUp}
      />

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {prompt.title}
        </h2>
        <p className="mb-6 text-gray-700">{prompt.description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentIdea}
              onChange={(e) => setCurrentIdea(e.target.value)}
              placeholder={IDEA_INPUT_PLACEHOLDER}
              className={cn(
                "flex-1 rounded-md border border-gray-300 px-4 py-2",
                "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500",
                error && "border-red-500"
              )}
              aria-label="Enter your idea"
              maxLength={MAX_IDEA_LENGTH}
            />
            <Button
              type="button"
              onClick={handleAddIdea}
              disabled={!currentIdea.trim() || isSubmitting}
              aria-label="Add idea"
            >
              Add Idea
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center justify-between rounded-md bg-gray-50 p-3"
              >
                <span className="text-gray-700">{idea.content}</span>
                <button
                  type="button"
                  onClick={() => setIdeas(ideas.filter(i => i.id !== idea.id))}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    "text-red-600 hover:bg-red-50 hover:text-red-700"
                  )}
                  aria-label={`Remove idea: ${idea.content}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-600">
              {ideas.length} of {MIN_IDEAS_REQUIRED} required ideas
              {ideas.length >= MIN_IDEAS_REQUIRED && ' (minimum met)'}
            </p>
            <Button
              type="submit"
              disabled={ideas.length < MIN_IDEAS_REQUIRED || isSubmitting}
              aria-label="Submit brainstorming drill"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ideas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
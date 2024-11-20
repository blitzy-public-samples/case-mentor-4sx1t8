// React v18.0.0
import React, { useState, useCallback } from 'react';
import { DrillTemplate, DrillAttempt, DrillStatus } from '../../types/drills';
import { useForm, FormState } from '../../hooks/use-form';
import { DrillTimer } from './drill-timer';
import { Button } from '../common/button';

// Human Tasks:
// 1. Verify form validation rules match latest evaluation criteria
// 2. Test form behavior with different drill types
// 3. Ensure timer synchronization across browser tabs

interface DrillAttemptFormProps {
  drill: DrillTemplate;
  attempt: DrillAttempt;
  onSubmit: (response: Record<string, any>) => Promise<void>;
  onTimeUp: () => void;
  isSubmitting: boolean;
}

// Requirement: Practice Drills - Enable users to attempt various types of case interview practice drills
export const DrillAttemptForm: React.FC<DrillAttemptFormProps> = ({
  drill,
  attempt,
  onSubmit,
  onTimeUp,
  isSubmitting
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Requirement: Practice Drills - Form validation based on drill type and evaluation criteria
  const formValidators = {
    response: (value: any) => {
      const errors: string[] = [];
      const fieldErrors: Record<string, string> = {};

      drill.evaluationCriteria.forEach(criteria => {
        if (!value || typeof value !== 'object') {
          errors.push(`Response must address ${criteria.category}`);
          fieldErrors[criteria.category] = `Please provide input for ${criteria.category}`;
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        fieldErrors
      };
    }
  };

  // Initialize form with validation
  const {
    values,
    errors,
    handleChange,
    handleSubmit: submitForm,
    isValid
  } = useForm({
    initialValues: {
      response: attempt.response || {}
    },
    validators: formValidators,
    onSubmit: async (values) => {
      if (attempt.status !== 'IN_PROGRESS') {
        return;
      }
      await onSubmit(values.response);
    }
  });

  // Requirement: Practice Drills - Handle drill pausing and resuming
  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Requirement: Practice Drills - Handle form submission with validation
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPaused) {
      return;
    }
    await submitForm();
  }, [isPaused, submitForm]);

  // Generate form fields based on drill type and evaluation criteria
  const renderFormFields = () => {
    switch (drill.type) {
      case 'CASE_PROMPT':
        return (
          <div className="space-y-4">
            <textarea
              name="response.analysis"
              value={values.response.analysis || ''}
              onChange={handleChange}
              className="w-full h-48 p-3 border rounded-md"
              placeholder="Enter your case analysis..."
              disabled={isSubmitting || isPaused}
            />
            {errors.response?.analysis && (
              <p className="text-red-500 text-sm">{errors.response.analysis}</p>
            )}
          </div>
        );

      case 'MARKET_SIZING':
        return (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                name="response.assumptions"
                value={values.response.assumptions || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="List your assumptions..."
                disabled={isSubmitting || isPaused}
              />
              {errors.response?.assumptions && (
                <p className="text-red-500 text-sm">{errors.response.assumptions}</p>
              )}
            </div>
            <div>
              <input
                type="number"
                name="response.calculation"
                value={values.response.calculation || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your final calculation..."
                disabled={isSubmitting || isPaused}
              />
              {errors.response?.calculation && (
                <p className="text-red-500 text-sm">{errors.response.calculation}</p>
              )}
            </div>
          </div>
        );

      case 'BRAINSTORMING':
        return (
          <div className="space-y-4">
            <textarea
              name="response.ideas"
              value={values.response.ideas || ''}
              onChange={handleChange}
              className="w-full h-48 p-3 border rounded-md"
              placeholder="List your ideas (one per line)..."
              disabled={isSubmitting || isPaused}
            />
            {errors.response?.ideas && (
              <p className="text-red-500 text-sm">{errors.response.ideas}</p>
            )}
          </div>
        );

      default:
        return (
          <textarea
            name="response.content"
            value={values.response.content || ''}
            onChange={handleChange}
            className="w-full h-48 p-3 border rounded-md"
            placeholder="Enter your response..."
            disabled={isSubmitting || isPaused}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{drill.title}</h2>
        <DrillTimer
          drill={drill}
          attempt={attempt}
          onTimeUp={onTimeUp}
          isPaused={isPaused}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium mb-2">Instructions</h3>
        <p className="text-gray-700">{drill.description}</p>
      </div>

      {renderFormFields()}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePause}
          disabled={isSubmitting}
          aria-label={isPaused ? 'Resume drill' : 'Pause drill'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        <div className="space-x-4">
          <Button
            variant="ghost"
            type="button"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!isValid || isSubmitting || isPaused}
            loading={isSubmitting}
          >
            Submit Response
          </Button>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          <p className="font-medium">Please fix the following errors:</p>
          <ul className="list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export type { DrillAttemptFormProps };
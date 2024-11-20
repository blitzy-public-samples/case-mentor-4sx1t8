// react v18.0.0
import React, { useState, useEffect, useCallback } from 'react'

// Internal imports with relative paths
import { buttonVariants } from '../shared/Button'
import { cardVariants } from '../shared/Card'
import Input from '../shared/Input'
import { useDrill } from '../../hooks/useDrill'

/**
 * Human Tasks:
 * 1. Verify proper error tracking integration for drill attempts
 * 2. Test keyboard navigation flow in form layout
 * 3. Validate color contrast ratios for all UI elements
 */

// Requirement: Practice Drills - Interface for synthesizing drill component
interface SynthesizingDrillProps {
  drillId: string
  onComplete: () => void
}

// Requirement: Practice Drills - Main synthesizing drill component
const SynthesizingDrill: React.FC<SynthesizingDrillProps> = ({
  drillId,
  onComplete
}) => {
  // State management for drill interaction
  const [response, setResponse] = useState<string>('')
  const [startTime] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Initialize drill hook with proper error handling
  const {
    drills,
    loading,
    error,
    submitAttempt,
    progress
  } = useDrill('synthesizing')

  // Get current drill data
  const currentDrill = drills.find(drill => drill.id === drillId)

  // Requirement: User Interface Design - Handle response input changes
  const handleResponseChange = useCallback((
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setResponse(event.target.value)
    setValidationError(null)
  }, [])

  // Requirement: Practice Drills - Validate response completeness
  const validateResponse = useCallback((response: string): boolean => {
    if (!response.trim()) {
      setValidationError('Response cannot be empty')
      return false
    }

    if (response.length < 50) {
      setValidationError('Response must be more detailed')
      return false
    }

    // Check for key components of synthesis
    const hasStructure = /^.*?(?:First|Initially|To begin).*$/m.test(response)
    const hasConclusion = /^.*?(?:Therefore|In conclusion|Overall).*$/m.test(response)

    if (!hasStructure || !hasConclusion) {
      setValidationError('Response must include clear structure and conclusion')
      return false
    }

    return true
  }, [])

  // Requirement: Practice Drills - Handle drill submission
  const handleSubmit = useCallback(async (
    event: React.FormEvent
  ) => {
    event.preventDefault()
    
    if (!validateResponse(response)) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      await submitAttempt(drillId, response, timeSpent)
      onComplete()
    } catch (err) {
      setValidationError('Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [drillId, response, startTime, submitAttempt, validateResponse, onComplete])

  // Requirement: Accessibility Requirements - Keyboard event handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'Enter') {
      handleSubmit(event)
    }
  }, [handleSubmit])

  // Show loading state
  if (loading || !currentDrill) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div 
        className={cardVariants({ shadow: 'sm', padding: 'lg' })}
        role="alert"
      >
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  // Requirement: User Interface Design - Main drill interface
  return (
    <div className="space-y-6">
      {/* Drill prompt card */}
      <div className={cardVariants({ shadow: 'md', padding: 'lg' })}>
        <h2 className="text-xl font-semibold mb-4">
          Synthesizing Exercise
        </h2>
        <p className="text-gray-700 mb-4">
          {currentDrill.prompt}
        </p>
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            Completed: {progress.attemptsCount} drills
          </span>
          <span>•</span>
          <span>
            Avg. Score: {progress.averageScore}%
          </span>
        </div>
      </div>

      {/* Response form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Requirement: Accessibility Requirements - ARIA-compliant textarea */}
        <div>
          <Input
            as="textarea"
            value={response}
            onChange={handleResponseChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your synthesized response..."
            className="min-h-[200px] w-full p-4"
            aria-label="Synthesis response"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? "validation-error" : undefined}
            disabled={isSubmitting}
          />
          {validationError && (
            <p 
              id="validation-error"
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {validationError}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className={buttonVariants({
              variant: 'ghost',
              size: 'lg'
            })}
            onClick={() => setResponse('')}
            disabled={isSubmitting || !response}
          >
            Clear
          </button>
          <button
            type="submit"
            className={buttonVariants({
              variant: 'primary',
              size: 'lg'
            })}
            disabled={isSubmitting || !response}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </form>

      {/* Keyboard shortcuts help */}
      <p className="text-sm text-gray-500 text-center">
        Pro tip: Press Ctrl + Enter to submit
      </p>
    </div>
  )
}

export default SynthesizingDrill
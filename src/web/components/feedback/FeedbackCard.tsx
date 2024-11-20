// react v18.0.0
import * as React from 'react'
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority'
// lucide-react v0.284.0
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

import Card from '../shared/Card'
import { FeedbackCategory, FeedbackSeverity, AIFeedback } from '../../types/feedback'
import { useFeedback } from '../../hooks/useFeedback'

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards for all severity indicators
 * 2. Test screen reader announcements for feedback severity levels
 * 3. Validate focus order for interactive elements within the card
 */

interface FeedbackCardProps {
  drillId: string
  className?: string
}

const getSeverityIcon = (severity: FeedbackSeverity): JSX.Element => {
  switch (severity) {
    case FeedbackSeverity.SUGGESTION:
      return <CheckCircle className="w-5 h-5" />
    case FeedbackSeverity.IMPORTANT:
      return <AlertCircle className="w-5 h-5" />
    case FeedbackSeverity.CRITICAL:
      return <XCircle className="w-5 h-5" />
  }
}

const getSeverityColor = (severity: FeedbackSeverity): string => {
  switch (severity) {
    case FeedbackSeverity.SUGGESTION:
      return 'text-green-500'
    case FeedbackSeverity.IMPORTANT:
      return 'text-yellow-500'
    case FeedbackSeverity.CRITICAL:
      return 'text-red-500'
  }
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ drillId, className }) => {
  // Requirement: AI Evaluation - Core service for AI-powered feedback
  const { feedback, isLoading } = useFeedback(drillId)

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="h-48 bg-gray-200 rounded-lg" />
      </Card>
    )
  }

  if (!feedback) {
    return null
  }

  // Requirement: Design System Specifications (7.1.1)
  // Group feedback points by category for structured display
  const feedbackByCategory = feedback.feedbackPoints.reduce((acc, point) => {
    if (!acc[point.category]) {
      acc[point.category] = []
    }
    acc[point.category].push(point)
    return acc
  }, {} as Record<FeedbackCategory, typeof feedback.feedbackPoints>)

  return (
    <Card 
      className={cn('space-y-6', className)}
      shadow="md"
      padding="lg"
    >
      {/* Requirement: User Management - Performance tracking */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Overall Score</h3>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold">
            {Math.round(feedback.overallScore)}%
          </span>
          <span className="text-gray-500">
            on {new Date(feedback.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Requirement: AI Evaluation - Categorized feedback display */}
      {Object.entries(feedbackByCategory).map(([category, points]) => (
        <div key={category} className="space-y-4">
          <h4 className="text-lg font-medium">{category}</h4>
          <div className="space-y-3">
            {points.map((point) => (
              <div 
                key={point.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md"
              >
                <span 
                  className={cn(
                    'flex-shrink-0 mt-1',
                    getSeverityColor(point.severity)
                  )}
                  aria-label={`Severity: ${point.severity.toLowerCase()}`}
                >
                  {getSeverityIcon(point.severity)}
                </span>
                <div className="space-y-1">
                  <p className="font-medium">{point.message}</p>
                  <p className="text-sm text-gray-600">{point.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Requirement: User Management - Progress tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-lg font-medium">Strengths</h4>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, index) => (
              <li 
                key={index}
                className="flex items-center space-x-2 text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-medium">Areas for Improvement</h4>
          <ul className="space-y-2">
            {feedback.improvements.map((improvement, index) => (
              <li 
                key={index}
                className="flex items-center space-x-2 text-yellow-600"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default FeedbackCard
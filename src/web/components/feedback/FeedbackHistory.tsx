// react v18.0.0
import * as React from 'react'
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority'
// lucide-react v0.284.0
import { TrendingUp, TrendingDown } from 'lucide-react'

import FeedbackCard from './FeedbackCard'
import { AIFeedback, FeedbackHistory as FeedbackHistoryType } from '../../types/feedback'
import { useFeedback } from '../../hooks/useFeedback'
import Card from '../shared/Card'
import Loading from '../shared/Loading'

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards for trend indicators
 * 2. Test screen reader announcements for performance trends
 * 3. Validate focus order for interactive timeline elements
 */

interface FeedbackHistoryProps {
  userId: string
  drillType: string
  className?: string
}

const renderPerformanceTrend = (history: FeedbackHistoryType): JSX.Element => {
  // Requirement: Progress Tracking - Performance analytics and trend visualization
  const latestScores = history.feedbackList
    .slice(-5)
    .map(feedback => feedback.overallScore)
  
  const trend = latestScores[latestScores.length - 1] - latestScores[0]
  const isImproving = trend >= 0
  
  return (
    <div 
      className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50"
      role="region"
      aria-label="Performance trend"
    >
      <span 
        className={cn(
          'flex items-center space-x-2',
          isImproving ? 'text-green-600' : 'text-red-600'
        )}
      >
        {isImproving ? (
          <TrendingUp className="w-6 h-6" aria-hidden="true" />
        ) : (
          <TrendingDown className="w-6 h-6" aria-hidden="true" />
        )}
        <span className="font-medium">
          {Math.abs(trend).toFixed(1)}% 
          {isImproving ? 'improvement' : 'decrease'} 
          in recent performance
        </span>
      </span>
      <span className="sr-only">
        Your performance has {isImproving ? 'improved' : 'decreased'} by 
        {Math.abs(trend).toFixed(1)} percent over the last 5 attempts
      </span>
    </div>
  )
}

const renderCommonPatterns = (history: FeedbackHistoryType): JSX.Element => {
  // Requirement: Progress Tracking - Pattern analysis and improvement areas
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div role="region" aria-label="Common strengths">
        <h3 className="text-lg font-medium mb-3">Common Strengths</h3>
        <ul className="space-y-2">
          {history.commonStrengths.map((strength, index) => (
            <li 
              key={index}
              className="flex items-center space-x-2 text-green-600"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" 
                aria-hidden="true" 
              />
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div role="region" aria-label="Common areas for improvement">
        <h3 className="text-lg font-medium mb-3">Areas for Improvement</h3>
        <ul className="space-y-2">
          {history.commonImprovements.map((improvement, index) => (
            <li 
              key={index}
              className="flex items-center space-x-2 text-yellow-600"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" 
                aria-hidden="true" 
              />
              <span>{improvement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Requirement: Design System - Implements consistent design system tokens
const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ 
  userId, 
  drillType, 
  className 
}) => {
  const { history, isLoading } = useFeedback(userId)

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <Loading size="lg" label="Loading feedback history..." />
      </Card>
    )
  }

  if (!history) {
    return null
  }

  return (
    <Card 
      className={cn('space-y-6 p-6', className)}
      role="region"
      aria-label="Feedback history and performance trends"
    >
      {/* Requirement: User Management - Performance analytics */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Performance Overview</h2>
        <p className="text-gray-600">
          Average Score: 
          <span className="ml-2 text-xl font-medium">
            {history.averageScore.toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Requirement: Progress Tracking - Performance trends */}
      {renderPerformanceTrend(history)}
      
      {/* Requirement: Progress Tracking - Pattern analysis */}
      {renderCommonPatterns(history)}

      {/* Requirement: Progress Tracking - Historical timeline */}
      <div 
        className="space-y-4"
        role="region"
        aria-label="Feedback timeline"
      >
        <h3 className="text-xl font-semibold">Feedback Timeline</h3>
        <div className="space-y-4">
          {history.feedbackList.map((feedback: AIFeedback) => (
            <FeedbackCard
              key={feedback.id}
              drillId={feedback.attemptId}
              className="border border-gray-200"
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export default FeedbackHistory
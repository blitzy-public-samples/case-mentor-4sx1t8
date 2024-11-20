// @testing-library/react v14.0.0
import { render, screen, waitFor } from '@testing-library/react'
// @testing-library/user-event v14.0.0
import { userEvent } from '@testing-library/user-event'
// vitest v0.34.0
import { vi } from 'vitest'

import FeedbackCard from '../../components/feedback/FeedbackCard'
import { FeedbackCategory, FeedbackSeverity, type AIFeedback } from '../../types/feedback'
import { useFeedback } from '../../hooks/useFeedback'

// Mock the useFeedback hook
vi.mock('../../hooks/useFeedback', () => ({
  useFeedback: vi.fn()
}))

/**
 * Human Tasks:
 * 1. Configure test environment to handle SVG icons from lucide-react
 * 2. Set up MSW handlers for API mocking if integration tests are needed
 * 3. Verify test coverage meets minimum threshold requirements
 */

const mockFeedbackData = (): AIFeedback => ({
  id: 'feedback-123',
  drillType: 'CASE_INTERVIEW',
  attemptId: 'attempt-123',
  overallScore: 85.5,
  feedbackPoints: [
    {
      id: 'point-1',
      category: FeedbackCategory.STRUCTURE,
      severity: FeedbackSeverity.SUGGESTION,
      message: 'Good framework application',
      suggestion: 'Consider adding more quantitative analysis'
    },
    {
      id: 'point-2',
      category: FeedbackCategory.ANALYSIS,
      severity: FeedbackSeverity.IMPORTANT,
      message: 'Missing key market factors',
      suggestion: 'Include competitor analysis'
    },
    {
      id: 'point-3',
      category: FeedbackCategory.CALCULATION,
      severity: FeedbackSeverity.CRITICAL,
      message: 'Calculation error in market sizing',
      suggestion: 'Review your multiplication steps'
    }
  ],
  strengths: [
    'Clear communication style',
    'Structured approach'
  ],
  improvements: [
    'Deepen quantitative analysis',
    'Strengthen hypothesis validation'
  ],
  createdAt: new Date('2023-09-20T10:00:00Z')
})

describe('FeedbackCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Requirement: AI Evaluation - Verify loading state display
  it('renders loading state correctly', () => {
    vi.mocked(useFeedback).mockReturnValue({
      feedback: null,
      isLoading: true,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    render(<FeedbackCard drillId="drill-123" />)
    
    const loadingElement = screen.getByRole('article')
    expect(loadingElement).toHaveClass('animate-pulse')
  })

  // Requirement: AI Evaluation - Test comprehensive feedback display
  it('displays feedback content when data is loaded', async () => {
    const mockFeedback = mockFeedbackData()
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockFeedback,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    render(<FeedbackCard drillId="drill-123" />)

    // Verify score display
    expect(screen.getByText('86%')).toBeInTheDocument()
    expect(screen.getByText(/September 20, 2023/)).toBeInTheDocument()

    // Verify feedback points
    mockFeedback.feedbackPoints.forEach(point => {
      expect(screen.getByText(point.message)).toBeInTheDocument()
      expect(screen.getByText(point.suggestion)).toBeInTheDocument()
    })

    // Verify strengths and improvements
    mockFeedback.strengths.forEach(strength => {
      expect(screen.getByText(strength)).toBeInTheDocument()
    })
    mockFeedback.improvements.forEach(improvement => {
      expect(screen.getByText(improvement)).toBeInTheDocument()
    })
  })

  // Requirement: AI Evaluation - Test empty state handling
  it('handles empty feedback data gracefully', () => {
    vi.mocked(useFeedback).mockReturnValue({
      feedback: null,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    const { container } = render(<FeedbackCard drillId="drill-123" />)
    expect(container.firstChild).toBeNull()
  })

  // Requirement: AI Evaluation - Verify severity indicators
  it('displays correct severity icons', () => {
    const mockFeedback = mockFeedbackData()
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockFeedback,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    render(<FeedbackCard drillId="drill-123" />)

    // Check suggestion severity
    const suggestionPoint = screen.getByText('Good framework application').parentElement
    expect(suggestionPoint?.previousElementSibling).toHaveClass('text-green-500')

    // Check important severity
    const importantPoint = screen.getByText('Missing key market factors').parentElement
    expect(importantPoint?.previousElementSibling).toHaveClass('text-yellow-500')

    // Check critical severity
    const criticalPoint = screen.getByText('Calculation error in market sizing').parentElement
    expect(criticalPoint?.previousElementSibling).toHaveClass('text-red-500')
  })

  // Requirement: User Management - Test progress tracking display
  it('displays strengths and improvements sections correctly', () => {
    const mockFeedback = mockFeedbackData()
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockFeedback,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    render(<FeedbackCard drillId="drill-123" />)

    expect(screen.getByText('Strengths')).toBeInTheDocument()
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument()

    const strengthsSection = screen.getByText('Strengths').parentElement
    expect(strengthsSection).toHaveClass('space-y-2')
    
    const improvementsSection = screen.getByText('Areas for Improvement').parentElement
    expect(improvementsSection).toHaveClass('space-y-2')
  })

  // Requirement: AI Evaluation - Test feedback categories display
  it('organizes feedback points by category', () => {
    const mockFeedback = mockFeedbackData()
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockFeedback,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn(),
      history: null
    })

    render(<FeedbackCard drillId="drill-123" />)

    expect(screen.getByText(FeedbackCategory.STRUCTURE)).toBeInTheDocument()
    expect(screen.getByText(FeedbackCategory.ANALYSIS)).toBeInTheDocument()
    expect(screen.getByText(FeedbackCategory.CALCULATION)).toBeInTheDocument()
  })
})
// @vitest-environment jsdom
import * as React from 'react';
// @testing-library/react ^14.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// vitest ^0.34.0
import { vi } from 'vitest';

import DrillCard from '../../../components/drills/DrillCard';
import { DrillType, DrillPrompt, DrillProgress, DrillDifficulty } from '../../../types/drills';

// Human Tasks:
// 1. Verify color contrast ratios for difficulty indicators using automated accessibility tools
// 2. Conduct manual screen reader testing with various devices and browsers
// 3. Test keyboard navigation patterns with different screen reader software
// 4. Validate subscription tier logic with backend integration tests

describe('DrillCard', () => {
  // Mock data setup
  const mockDrillPrompt: DrillPrompt = {
    id: 'test-drill-1',
    type: DrillType.CASE_PROMPT,
    difficulty: DrillDifficulty.INTERMEDIATE,
    title: 'Test Case Prompt',
    description: 'Test description',
    timeLimit: 15,
    industry: 'Technology',
    requiredTier: 'BASIC'
  };

  const mockDrillProgress: DrillProgress = {
    drillType: DrillType.CASE_PROMPT,
    attemptsCount: 5,
    averageScore: 85,
    bestScore: 95,
    lastAttemptDate: new Date('2023-01-01T00:00:00.000Z')
  };

  const mockOnStart = vi.fn();

  beforeEach(() => {
    mockOnStart.mockClear();
  });

  // Requirement: User Interface Design - Component rendering
  it('renders drill information correctly', () => {
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={mockOnStart}
      />
    );

    // Verify title and description
    expect(screen.getByText(mockDrillPrompt.title)).toBeInTheDocument();
    expect(screen.getByText(mockDrillPrompt.description)).toBeInTheDocument();

    // Verify drill type display
    expect(screen.getByText(mockDrillPrompt.type)).toBeInTheDocument();

    // Verify difficulty level
    expect(screen.getByText(mockDrillPrompt.difficulty)).toBeInTheDocument();
    expect(screen.getByText(mockDrillPrompt.difficulty)).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Verify industry and time limit
    expect(screen.getByText(mockDrillPrompt.industry)).toBeInTheDocument();
    expect(screen.getByText(`${mockDrillPrompt.timeLimit} min`)).toBeInTheDocument();

    // Verify subscription tier
    expect(screen.getByText(mockDrillPrompt.requiredTier)).toBeInTheDocument();
  });

  // Requirement: Practice Drills - Interaction handling
  it('handles start practice button click', async () => {
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={mockOnStart}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    await waitFor(() => {
      expect(mockOnStart).toHaveBeenCalledTimes(1);
      expect(mockOnStart).toHaveBeenCalledWith(mockDrillPrompt);
    });
  });

  // Requirement: User Management - Progress display
  it('displays progress correctly', () => {
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={mockOnStart}
      />
    );

    // Verify progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', mockDrillProgress.averageScore.toString());
    expect(progressBar.parentElement).toBeInTheDocument();

    // Verify score display
    expect(screen.getByText(`${Math.round(mockDrillProgress.averageScore)}%`)).toBeInTheDocument();
  });

  // Requirement: Accessibility Requirements - A11y features
  it('meets accessibility requirements', () => {
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={mockOnStart}
      />
    );

    // Verify ARIA labels
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute(
      'aria-label',
      `Start ${mockDrillPrompt.title} drill - ${mockDrillPrompt.difficulty} difficulty`
    );

    // Verify keyboard interaction
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockOnStart).toHaveBeenCalledTimes(1);

    mockOnStart.mockClear();
    fireEvent.keyDown(card, { key: ' ' });
    expect(mockOnStart).toHaveBeenCalledTimes(1);

    // Verify focus management
    expect(card).toHaveFocus();
  });

  // Requirement: Practice Drills - Conditional rendering
  it('renders without progress information', () => {
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={undefined}
        onStart={mockOnStart}
      />
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // Requirement: User Interface Design - Custom styling
  it('accepts and applies custom className', () => {
    const customClass = 'custom-test-class';
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={mockOnStart}
        className={customClass}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass(customClass);
  });
});
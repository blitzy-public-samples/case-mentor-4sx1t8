// @package react ^18.0.0
// @package @testing-library/react ^14.0.0
// @package @testing-library/user-event ^14.0.0
// @package vitest ^0.34.0

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DrillCard } from '../../components/drills/drill-card';
import { DrillList } from '../../components/drills/drill-list';
import { useDrills } from '../../hooks/use-drills';

// Mock the useDrills hook
vi.mock('../../hooks/use-drills', () => ({
  useDrills: vi.fn()
}));

// Mock drill template data
const mockDrillTemplate = {
  id: 'mock-drill-id',
  type: 'CASE_PROMPT',
  difficulty: 'INTERMEDIATE',
  title: 'Mock Drill',
  description: 'Mock drill description',
  evaluationCriteria: [],
  timeLimit: 30
};

// Mock drill attempt data
const mockDrillAttempt = {
  id: 'mock-attempt-id',
  drillId: 'mock-drill-id',
  status: 'IN_PROGRESS',
  score: 85,
  performanceMetrics: {}
};

// Mock hook implementation
const mockUseDrills = {
  drills: [mockDrillTemplate],
  userAttempts: [mockDrillAttempt],
  loading: false,
  error: null,
  startDrill: vi.fn(),
  submitDrillAttempt: vi.fn(),
  abandonDrill: vi.fn()
};

describe('DrillCard', () => {
  // Requirement: Practice Drills - Verify correct rendering and functionality
  it('renders correctly with all drill statuses', async () => {
    const statuses = ['IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'ABANDONED'] as const;
    const onStart = vi.fn();
    const onResume = vi.fn();

    for (const status of statuses) {
      render(
        <DrillCard
          drill={mockDrillTemplate}
          status={status}
          score={85}
          onStart={onStart}
          onResume={onResume}
        />
      );

      // Verify status badge
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent(status.replace('_', ' '));
      
      // Verify proper ARIA label
      expect(badge).toHaveAttribute(
        'aria-label',
        `Drill status: ${status.toLowerCase().replace('_', ' ')}`
      );

      // Clean up after each status test
      screen.unmount();
    }
  });

  // Requirement: User Management - Validate progress tracking
  it('displays score correctly when provided', () => {
    render(
      <DrillCard
        drill={mockDrillTemplate}
        status="COMPLETED"
        score={85}
        onStart={vi.fn()}
        onResume={vi.fn()}
      />
    );

    expect(screen.getByText('Score: 85%')).toBeInTheDocument();
  });

  // Requirement: Practice Drills - Test action button behavior
  it('handles action buttons correctly', async () => {
    const onStart = vi.fn();
    const onResume = vi.fn();
    const user = userEvent.setup();

    // Test Start button
    render(
      <DrillCard
        drill={mockDrillTemplate}
        status="COMPLETED"
        score={null}
        onStart={onStart}
        onResume={onResume}
      />
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    await user.click(startButton);
    expect(onStart).toHaveBeenCalledTimes(1);

    screen.unmount();

    // Test Resume button
    render(
      <DrillCard
        drill={mockDrillTemplate}
        status="IN_PROGRESS"
        score={null}
        onStart={onStart}
        onResume={onResume}
      />
    );

    const resumeButton = screen.getByRole('button', { name: /resume/i });
    await user.click(resumeButton);
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});

describe('DrillList', () => {
  beforeEach(() => {
    vi.mocked(useDrills).mockReturnValue(mockUseDrills);
  });

  // Requirement: Practice Drills - Test loading states
  it('handles loading state correctly', () => {
    vi.mocked(useDrills).mockReturnValue({
      ...mockUseDrills,
      loading: true
    });

    render(<DrillList />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Requirement: Practice Drills - Test error handling
  it('displays error message when loading fails', () => {
    vi.mocked(useDrills).mockReturnValue({
      ...mockUseDrills,
      error: new Error('Failed to load drills')
    });

    render(<DrillList />);
    
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to load drills. Please try again later.'
    );
  });

  // Requirement: Practice Drills - Test drill filtering
  it('filters drills correctly', async () => {
    const user = userEvent.setup();
    render(<DrillList />);

    // Find and click type filter
    const typeFilter = screen.getByRole('combobox', { name: /type/i });
    await user.click(typeFilter);
    await user.click(screen.getByRole('option', { name: /case prompt/i }));

    // Verify ARIA live region update
    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toHaveTextContent(/filters updated/i);
  });

  // Requirement: User Management - Test drill interactions
  it('handles drill card interactions within list', async () => {
    const user = userEvent.setup();
    render(<DrillList />);

    // Find and click start button on drill card
    const startButton = screen.getByRole('button', { name: /start mock drill/i });
    await user.click(startButton);

    expect(mockUseDrills.startDrill).toHaveBeenCalledWith('mock-drill-id');
  });

  // Requirement: Practice Drills - Test empty state
  it('shows empty state message when no drills match filters', () => {
    vi.mocked(useDrills).mockReturnValue({
      ...mockUseDrills,
      drills: []
    });

    render(<DrillList />);
    
    expect(screen.getByText(/no drills found/i)).toBeInTheDocument();
  });

  // Requirement: Practice Drills - Test keyboard navigation
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DrillList />);

    const drillCard = screen.getByRole('listitem');
    await user.tab();
    
    expect(drillCard).toHaveFocus();
  });
});
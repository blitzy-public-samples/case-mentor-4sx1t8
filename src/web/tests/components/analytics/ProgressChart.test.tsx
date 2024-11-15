// react ^18.0.0
import React from 'react';
// @testing-library/react ^14.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @testing-library/user-event ^14.0.0
import userEvent from '@testing-library/user-event';
// vitest ^0.34.0
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { ProgressChart } from '../../../../components/analytics/ProgressChart';
import { useProgress } from '../../../../hooks/useProgress';
import type { UserProgress } from '../../../../types/user';

// Mock the useProgress hook
vi.mock('../../../../hooks/useProgress');

// Mock progress data that matches the UserProgress interface
const mockProgressData: UserProgress = {
  userId: 'test-user-id',
  drillsCompleted: 50,
  drillsSuccessRate: 85,
  simulationsCompleted: 25,
  simulationsSuccessRate: 75,
  skillLevels: {
    marketSizing: 80,
    calculation: 85,
    synthesis: 70
  },
  lastUpdated: new Date('2024-01-01T00:00:00Z')
};

// Human Tasks:
// 1. Configure test data to match production data patterns
// 2. Set up performance monitoring for test execution
// 3. Implement test coverage reporting integration

describe('ProgressChart', () => {
  const mockUseProgress = useProgress as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgress.mockReset();
  });

  // Requirement: User Management - Verify progress tracking functionality
  it('renders loading state correctly', async () => {
    mockUseProgress.mockReturnValue({
      progress: null,
      isLoading: true,
      error: null
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  // Requirement: User Management - Verify error handling in progress tracking
  it('renders error state correctly', async () => {
    const errorMessage = 'Failed to fetch progress data';
    mockUseProgress.mockReturnValue({
      progress: null,
      isLoading: false,
      error: { message: errorMessage }
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    expect(screen.getByText(`Error loading progress data: ${errorMessage}`)).toBeInTheDocument();
  });

  // Requirement: System Performance - Validate tracking of >80% completion rate
  it('displays performance alert when drill success rate is below 80%', async () => {
    const lowPerformanceData = {
      ...mockProgressData,
      drillsSuccessRate: 75
    };

    mockUseProgress.mockReturnValue({
      progress: lowPerformanceData,
      isLoading: false,
      error: null
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    expect(screen.getByText(/Warning: Drill success rate is below the 80% target threshold/i)).toBeInTheDocument();
  });

  // Requirement: User Management - Verify data visualization accuracy
  it('renders chart with correct progress data', async () => {
    mockUseProgress.mockReturnValue({
      progress: mockProgressData,
      isLoading: false,
      error: null
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    // Verify chart elements
    expect(screen.getByText('Drills Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Simulations Success Rate')).toBeInTheDocument();
    
    // Verify data points are rendered
    const chartContainer = screen.getByRole('graphics-document');
    expect(chartContainer).toBeInTheDocument();
    
    // Verify success rates are displayed correctly
    expect(chartContainer).toHaveTextContent('85%');
    expect(chartContainer).toHaveTextContent('75%');
  });

  it('applies custom height and className props correctly', async () => {
    mockUseProgress.mockReturnValue({
      progress: mockProgressData,
      isLoading: false,
      error: null
    });

    const customHeight = '600px';
    const customClass = 'custom-chart';

    render(
      <ProgressChart 
        userId="test-user-id" 
        height={customHeight} 
        className={customClass}
      />
    );
    
    const chartContainer = screen.getByRole('graphics-document');
    expect(chartContainer).toHaveStyle({ height: customHeight });
    expect(chartContainer).toHaveClass(customClass);
  });

  // Requirement: User Management - Verify interactive features
  it('handles tooltip interactions correctly', async () => {
    mockUseProgress.mockReturnValue({
      progress: mockProgressData,
      isLoading: false,
      error: null
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    const chartArea = screen.getByRole('graphics-document');
    
    // Simulate hovering over a data point
    await userEvent.hover(chartArea);
    
    // Verify tooltip content
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toHaveTextContent('85%');
    });
    
    // Simulate moving mouse away
    await userEvent.unhover(chartArea);
    
    // Verify tooltip disappears
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('handles empty progress data correctly', async () => {
    mockUseProgress.mockReturnValue({
      progress: null,
      isLoading: false,
      error: null
    });

    render(<ProgressChart userId="test-user-id" height="400px" />);
    
    expect(screen.getByText('No progress data available')).toBeInTheDocument();
  });
});
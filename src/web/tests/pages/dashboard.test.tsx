// react version: ^18.0.0
// @testing-library/react version: ^14.0.0
// vitest version: ^0.34.0

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { MockInstance } from 'vitest';
import DashboardPage from '../../app/dashboard/page';
import { DrillProgress, type DrillProgressProps } from '../../components/drills/drill-progress';
import { useAuth } from '../../hooks/use-auth';

// Human Tasks:
// 1. Configure test data generators for consistent test data
// 2. Set up test coverage reporting thresholds
// 3. Configure CI pipeline test execution parameters
// 4. Set up performance monitoring for test execution times

// Mock dependencies
vi.mock('../../hooks/use-auth');
vi.mock('../../components/drills/drill-progress');
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

// Mock test data
const mockDrillProgress = {
  drillProgress: [
    {
      type: 'MARKET_SIZING',
      completed: 5,
      total: 10,
      averageScore: 85,
      performanceMetrics: {
        timeSpent: 3600,
        attemptsCount: 5,
        completionRate: 50,
        strengthAreas: ['hypothesis formation'],
        improvementAreas: ['calculations']
      }
    }
  ],
  recentActivity: [
    {
      id: '1',
      drillType: 'MARKET_SIZING',
      completedAt: '2023-09-01T10:00:00Z',
      score: 85,
      timeSpent: 1800,
      status: 'COMPLETED'
    }
  ],
  simulationResults: {
    id: 'sim-1',
    config: {
      difficulty: 'MEDIUM',
      industry: 'TECHNOLOGY',
      timeLimit: 3600
    }
  },
  interviewCountdown: 30
};

const mockAuthState = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  },
  session: {
    access_token: 'mock-token'
  },
  role: 'user',
  loading: false,
  permissions: ['view_dashboard']
};

describe('DashboardPage', () => {
  let useAuthMock: MockInstance;
  let fetchMock: MockInstance;

  beforeEach(() => {
    // Mock useAuth hook
    useAuthMock = vi.mocked(useAuth).mockReturnValue({
      authState: mockAuthState,
      loading: false,
      handleLogin: vi.fn(),
      handleRegister: vi.fn(),
      handleLogout: vi.fn()
    });

    // Mock fetch API
    fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockDrillProgress), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    // Mock DrillProgress component
    vi.mocked(DrillProgress).mockImplementation(({ className, showDetailed }: DrillProgressProps) => (
      <div data-testid="drill-progress" data-show-detailed={showDetailed} className={className}>
        Mock Drill Progress
      </div>
    ));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @requirement User Management - Progress tracking and performance analytics
   */
  it('should render welcome message with user name', async () => {
    render(await DashboardPage());

    expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Your interview is scheduled for/i)).toBeInTheDocument();
  });

  /**
   * @requirement User Management - Progress tracking and performance analytics
   */
  it('should display drill progress component', async () => {
    render(await DashboardPage());

    const progressComponent = screen.getByTestId('drill-progress');
    expect(progressComponent).toBeInTheDocument();
    expect(progressComponent).toHaveAttribute('data-show-detailed', 'true');
    expect(progressComponent).toHaveClass('h-full');
  });

  /**
   * @requirement User Management - Progress tracking and performance analytics
   */
  it('should show simulation results when available', async () => {
    render(await DashboardPage());

    expect(screen.getByText(/McKinsey Simulation Results/i)).toBeInTheDocument();
  });

  /**
   * @requirement System Performance - API response time monitoring
   */
  it('should handle loading state and data fetching', async () => {
    // Mock loading state
    useAuthMock.mockReturnValueOnce({
      authState: mockAuthState,
      loading: true,
      handleLogin: vi.fn(),
      handleRegister: vi.fn(),
      handleLogout: vi.fn()
    });

    render(await DashboardPage());

    // Verify API call
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/dashboard/${mockAuthState.user.id}`,
      {
        next: { revalidate: 300 },
        headers: {
          'Authorization': `Bearer ${mockAuthState.session.access_token}`
        }
      }
    );

    // Verify data rendering
    await waitFor(() => {
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
      mockDrillProgress.recentActivity.forEach(activity => {
        expect(screen.getByText(`Score: ${activity.score}%`)).toBeInTheDocument();
      });
    });
  });

  /**
   * @requirement User Management - Authentication state management
   */
  it('should redirect to login when user is not authenticated', async () => {
    const redirect = vi.fn();
    vi.mock('next/navigation', () => ({ redirect }));

    useAuthMock.mockReturnValueOnce({
      authState: { ...mockAuthState, user: null },
      loading: false,
      handleLogin: vi.fn(),
      handleRegister: vi.fn(),
      handleLogout: vi.fn()
    });

    render(await DashboardPage());
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  /**
   * @requirement System Performance - Error handling
   */
  it('should handle API error gracefully', async () => {
    fetchMock.mockRejectedValueOnce(new Error('API Error'));
    
    await expect(DashboardPage()).rejects.toThrow('API Error');
  });
});
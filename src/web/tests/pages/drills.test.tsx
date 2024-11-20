// @package react ^18.0.0
// @package @testing-library/react ^14.0.0
// @package vitest ^0.34.0

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DrillsPage from '../../app/drills/page';

// Human Tasks:
// 1. Configure test environment variables for subscription tiers
// 2. Set up test data seeding for drill templates
// 3. Configure mock API endpoints for testing
// 4. Verify test coverage thresholds in CI/CD pipeline

// Mock all required hooks
vi.mock('../../hooks/use-auth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/use-subscription', () => ({
  useSubscription: vi.fn()
}));

vi.mock('../../hooks/use-drills', () => ({
  useDrills: vi.fn()
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

// Test data constants
const mockDrillData = [
  {
    id: '1',
    title: 'Market Sizing Drill',
    type: 'MARKET_SIZING',
    difficulty: 'MEDIUM',
    description: 'Practice market sizing techniques',
    requiredSubscription: 'FREE'
  },
  {
    id: '2',
    title: 'Case Math Drill',
    type: 'CASE_MATH',
    difficulty: 'HARD',
    description: 'Advanced case math practice',
    requiredSubscription: 'PREMIUM'
  }
];

const mockUserAttempts = [
  {
    id: '1',
    drillId: '1',
    userId: 'test-user',
    status: 'COMPLETED',
    score: 85,
    completedAt: '2023-01-01T00:00:00Z'
  }
];

const mockAuthState = {
  user: null,
  session: null,
  role: 'anonymous',
  loading: false,
  lastActivity: null,
  permissions: []
};

const mockSubscriptionState = {
  tier: 'FREE',
  status: 'ACTIVE',
  expiresAt: '2024-01-01T00:00:00Z',
  autoRenew: true
};

describe('DrillsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    vi.mocked(useAuth).mockImplementation(() => ({
      authState: { ...mockAuthState },
      handleLogin: vi.fn(),
      handleLogout: vi.fn(),
      handleRegister: vi.fn(),
      loading: false
    }));

    vi.mocked(useSubscription).mockImplementation(() => ({
      subscription: { ...mockSubscriptionState },
      isLoading: false,
      error: null,
      createCheckoutSession: vi.fn(),
      cancelSubscription: vi.fn(),
      updateAutoRenew: vi.fn()
    }));

    vi.mocked(useDrills).mockImplementation(() => ({
      drills: [...mockDrillData],
      userAttempts: [...mockUserAttempts],
      loading: false,
      error: null,
      startDrill: vi.fn(),
      submitDrillAttempt: vi.fn(),
      abandonDrill: vi.fn()
    }));
  });

  /**
   * @requirement Authentication Flow
   * Test unauthenticated user redirection
   */
  it('redirects to login when user is not authenticated', async () => {
    const mockRedirect = vi.mocked(redirect);
    
    render(<DrillsPage />);
    
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });

  /**
   * @requirement Subscription System
   * Test subscription upgrade prompt for free tier users
   */
  it('displays subscription upgrade prompt for free tier users', async () => {
    // Mock authenticated user with free subscription
    vi.mocked(useAuth).mockImplementation(() => ({
      authState: {
        ...mockAuthState,
        user: { id: 'test-user', email: 'test@example.com' },
        session: { token: 'test-token' }
      },
      handleLogin: vi.fn(),
      handleLogout: vi.fn(),
      handleRegister: vi.fn(),
      loading: false
    }));

    render(<DrillsPage />);

    await waitFor(() => {
      expect(screen.getByText('Limited Access')).toBeInTheDocument();
      expect(screen.getByText(/Upgrade your subscription/)).toBeInTheDocument();
      expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    });
  });

  /**
   * @requirement Practice Drills
   * Test drill list rendering and filtering for paid users
   */
  it('renders drill list with filters for paid users', async () => {
    // Mock authenticated user with premium subscription
    vi.mocked(useAuth).mockImplementation(() => ({
      authState: {
        ...mockAuthState,
        user: { id: 'test-user', email: 'test@example.com' },
        session: { token: 'test-token' }
      },
      handleLogin: vi.fn(),
      handleLogout: vi.fn(),
      handleRegister: vi.fn(),
      loading: false
    }));

    vi.mocked(useSubscription).mockImplementation(() => ({
      subscription: { ...mockSubscriptionState, tier: 'PREMIUM' },
      isLoading: false,
      error: null,
      createCheckoutSession: vi.fn(),
      cancelSubscription: vi.fn(),
      updateAutoRenew: vi.fn()
    }));

    render(<DrillsPage />);

    await waitFor(() => {
      // Verify premium content is accessible
      expect(screen.getByText('Market Sizing Drill')).toBeInTheDocument();
      expect(screen.getByText('Case Math Drill')).toBeInTheDocument();
      // Verify upgrade prompt is not shown
      expect(screen.queryByText('Limited Access')).not.toBeInTheDocument();
    });
  });

  /**
   * @requirement Subscription System
   * Test subscription loading state
   */
  it('displays loading state while checking subscription', async () => {
    vi.mocked(useSubscription).mockImplementation(() => ({
      subscription: null,
      isLoading: true,
      error: null,
      createCheckoutSession: vi.fn(),
      cancelSubscription: vi.fn(),
      updateAutoRenew: vi.fn()
    }));

    render(<DrillsPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading subscription status')).toBeInTheDocument();
  });

  /**
   * @requirement Practice Drills
   * Test drill interaction for authenticated users
   */
  it('allows starting drills for authenticated users', async () => {
    const mockStartDrill = vi.fn();
    
    vi.mocked(useAuth).mockImplementation(() => ({
      authState: {
        ...mockAuthState,
        user: { id: 'test-user', email: 'test@example.com' },
        session: { token: 'test-token' }
      },
      handleLogin: vi.fn(),
      handleLogout: vi.fn(),
      handleRegister: vi.fn(),
      loading: false
    }));

    vi.mocked(useDrills).mockImplementation(() => ({
      drills: [...mockDrillData],
      userAttempts: [...mockUserAttempts],
      loading: false,
      error: null,
      startDrill: mockStartDrill,
      submitDrillAttempt: vi.fn(),
      abandonDrill: vi.fn()
    }));

    render(<DrillsPage />);

    await waitFor(() => {
      const drillElement = screen.getByText('Market Sizing Drill');
      fireEvent.click(drillElement);
      expect(mockStartDrill).toHaveBeenCalledWith('1');
    });
  });
});
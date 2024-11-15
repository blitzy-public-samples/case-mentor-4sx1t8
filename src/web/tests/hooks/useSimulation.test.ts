// @jest/globals v29.7.0
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
// @testing-library/react-hooks v8.0.1
import { renderHook, act } from '@testing-library/react-hooks';
// msw v1.3.0
import { rest } from 'msw';

import { useSimulation } from '../../hooks/useSimulation';
import { 
  SimulationState, 
  SimulationStatus, 
  Species, 
  EnvironmentParameters, 
  SimulationResult,
  SpeciesType 
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Configure MSW handlers in test setup files
 * 2. Set up test environment variables for API endpoints
 * 3. Configure test coverage thresholds
 */

// Mock data for testing
const mockSpecies: Species = {
  id: 'test-species-1',
  name: 'Test Species',
  type: SpeciesType.PRODUCER,
  energyRequirement: 10,
  reproductionRate: 1.5
};

const mockEnvironment: EnvironmentParameters = {
  temperature: 25,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

const mockSimulationResult: SimulationResult = {
  simulationId: 'test-sim-1',
  score: 85,
  ecosystemStability: 0.9,
  speciesBalance: 0.8,
  feedback: ['Ecosystem achieved stability'],
  completedAt: '2023-01-01T00:00:00Z'
};

// Mock API responses
const mockSimulationState: SimulationState = {
  id: 'test-sim-1',
  userId: 'test-user-1',
  species: [],
  environment: mockEnvironment,
  timeRemaining: 300,
  status: SimulationStatus.SETUP
};

describe('useSimulation', () => {
  // Mock API handlers
  const handlers = [
    rest.post('/api/simulation', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: mockSimulationState,
          error: null
        })
      );
    }),
    rest.post('/api/simulation/:id/species', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            ...mockSimulationState,
            species: [mockSpecies]
          },
          error: null
        })
      );
    }),
    rest.post('/api/simulation/:id/environment', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            ...mockSimulationState,
            environment: mockEnvironment
          },
          error: null
        })
      );
    }),
    rest.post('/api/simulation/:id/start', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            ...mockSimulationState,
            status: SimulationStatus.RUNNING
          },
          error: null
        })
      );
    }),
    rest.post('/api/simulation/:id/stop', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            ...mockSimulationState,
            status: SimulationStatus.COMPLETED
          },
          error: null
        })
      );
    }),
    rest.get('/api/simulation/:id', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: mockSimulationState,
          error: null
        })
      );
    }),
    rest.get('/api/simulation/:id/result', (req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: mockSimulationResult,
          error: null
        })
      );
    })
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Clear and reset MSW handlers
    global.server.resetHandlers(...handlers);
  });

  it('should initialize with default state', () => {
    // Test Requirement: Simulation Engine - Verify initial state management
    const { result } = renderHook(() => useSimulation());

    expect(result.current.simulationState).toBeNull();
    expect(result.current.simulationResult).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it('should handle species management', async () => {
    // Test Requirement: McKinsey Simulation - Species management functionality
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.addSpecies(mockSpecies);
    });

    expect(result.current.simulationState?.species).toHaveLength(1);
    expect(result.current.simulationState?.species[0]).toEqual(mockSpecies);

    act(() => {
      result.current.removeSpecies(mockSpecies.id);
    });

    expect(result.current.simulationState?.species).toHaveLength(0);
  });

  it('should handle environment updates', async () => {
    // Test Requirement: McKinsey Simulation - Environment configuration
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.updateEnvironment(mockEnvironment);
    });

    expect(result.current.simulationState?.environment).toEqual(mockEnvironment);
    expect(result.current.error).toBeNull();

    // Test invalid environment parameters
    const invalidEnvironment = { ...mockEnvironment, temperature: -20 };
    await act(async () => {
      await result.current.updateEnvironment(invalidEnvironment);
    });

    expect(result.current.error).not.toBeNull();
  });

  it('should manage simulation lifecycle', async () => {
    // Test Requirement: Simulation Engine - Lifecycle management
    const { result } = renderHook(() => useSimulation());

    // Start simulation
    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.RUNNING);
    expect(result.current.loading).toBeFalsy();

    // Stop simulation
    await act(async () => {
      await result.current.stopSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.COMPLETED);

    // Reset simulation
    act(() => {
      result.current.resetSimulation();
    });

    expect(result.current.simulationState).toBeNull();
    expect(result.current.simulationResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    // Test Requirement: Simulation Engine - Error handling
    const { result } = renderHook(() => useSimulation());

    // Mock API error
    global.server.use(
      rest.post('/api/simulation/:id/start', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            data: null,
            error: { message: 'Internal server error', code: 'SERVER_ERROR' }
          })
        );
      })
    );

    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.loading).toBeFalsy();
  });

  it('should poll for updates during active simulation', async () => {
    // Test Requirement: McKinsey Simulation - Real-time updates
    jest.useFakeTimers();
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.RUNNING);

    // Advance timers to trigger polling
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.simulationState).not.toBeNull();

    jest.useRealTimers();
  });
});
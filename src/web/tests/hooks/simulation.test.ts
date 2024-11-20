// @jest/globals version: ^29.0.0
// @testing-library/react-hooks version: ^8.0.0
// @testing-library/react version: ^13.0.0

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useSimulation } from '../../hooks/use-simulation';
import { apiClient } from '../../lib/api-client';
import type { SimulationConfig, Species, EnvironmentParameter, SimulationDuration } from '../../types/simulation';

// Mock the API client
jest.mock('../../lib/api-client');

// Mock getCurrentSession from auth
jest.mock('../../lib/auth', () => ({
  getCurrentSession: jest.fn().mockResolvedValue({ access_token: 'test-token' })
}));

describe('useSimulation', () => {
  // Test data setup
  const mockSpecies: Species[] = [
    {
      id: 'species1',
      name: 'Test Species 1',
      type: 'PRODUCER',
      populationSize: 100
    }
  ];

  const mockEnvironment: EnvironmentParameter = {
    temperature: 25,
    depth: 100,
    salinity: 35,
    lightLevel: 80
  };

  const mockDuration: SimulationDuration = {
    minutes: 5,
    seconds: 0
  };

  const mockSimulationConfig: SimulationConfig = {
    selectedSpecies: mockSpecies,
    environment: mockEnvironment,
    duration: mockDuration
  };

  const mockSimulationId = 'test-simulation-id';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup API client mocks with type safety
    (apiClient.post as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/simulations') {
        return Promise.resolve({
          success: true,
          data: { id: mockSimulationId }
        });
      }
      return Promise.resolve({ success: true });
    });

    (apiClient.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        success: true,
        data: {
          isSelecting: true,
          selectedSpeciesIds: [mockSpecies[0].id],
          timeRemaining: mockDuration
        }
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @requirement McKinsey Simulation
   * Tests initialization of simulation with proper configuration
   */
  it('should initialize simulation', async () => {
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      const simulationId = await result.current.initializeSimulation(mockSimulationConfig);
      expect(simulationId).toBe(mockSimulationId);
    });

    // Verify API call
    expect(apiClient.post).toHaveBeenCalledWith('/api/simulations', {
      config: mockSimulationConfig,
      sessionId: 'test-token'
    });

    // Verify state updates
    expect(result.current.simulationState).toEqual({
      isSelecting: true,
      selectedSpeciesIds: [mockSpecies[0].id],
      timeRemaining: mockDuration
    });
  });

  /**
   * @requirement McKinsey Simulation
   * Tests species update functionality with validation
   */
  it('should update species', async () => {
    const { result } = renderHook(() => useSimulation(mockSimulationId));

    const newSpeciesIds = ['species2', 'species3'];

    await act(async () => {
      await result.current.updateSpecies(newSpeciesIds);
    });

    // Verify API call
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/simulations/${mockSimulationId}/species`,
      { speciesIds: newSpeciesIds }
    );

    // Verify state updates
    await waitFor(() => {
      expect(result.current.simulationState.selectedSpeciesIds).toEqual(newSpeciesIds);
    });
  });

  /**
   * @requirement McKinsey Simulation
   * Tests environment parameter updates
   */
  it('should update environment', async () => {
    const { result } = renderHook(() => useSimulation(mockSimulationId));

    const newEnvironment: EnvironmentParameter = {
      temperature: 30,
      depth: 150,
      salinity: 40,
      lightLevel: 60
    };

    await act(async () => {
      await result.current.updateEnvironment(newEnvironment);
    });

    // Verify API call
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/simulations/${mockSimulationId}/environment`,
      { params: newEnvironment }
    );
  });

  /**
   * @requirement System Performance
   * Tests error handling for API failures
   */
  it('should handle API errors gracefully', async () => {
    (apiClient.post as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ success: false })
    );

    const { result } = renderHook(() => useSimulation());

    await expect(
      act(async () => {
        await result.current.initializeSimulation(mockSimulationConfig);
      })
    ).rejects.toThrow('Failed to initialize simulation');
  });

  /**
   * @requirement McKinsey Simulation
   * Tests time tracking functionality
   */
  it('should track remaining time correctly', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.initializeSimulation(mockSimulationConfig);
    });

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Verify time update
    expect(result.current.simulationState.timeRemaining).toEqual({
      minutes: 4,
      seconds: 59
    });

    jest.useRealTimers();
  });

  /**
   * @requirement McKinsey Simulation
   * Tests validation of simulation state
   */
  it('should require simulation ID for updates', async () => {
    const { result } = renderHook(() => useSimulation());

    await expect(
      act(async () => {
        await result.current.updateSpecies(['species1']);
      })
    ).rejects.toThrow('No active simulation');

    await expect(
      act(async () => {
        await result.current.updateEnvironment(mockEnvironment);
      })
    ).rejects.toThrow('No active simulation');
  });
});
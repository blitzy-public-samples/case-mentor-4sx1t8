/**
 * Human Tasks:
 * 1. Configure monitoring for simulation performance metrics
 * 2. Set up error tracking for simulation state updates
 * 3. Implement proper cleanup for simulation resources on unmount
 * 4. Configure proper timeout handling for simulation API calls
 */

// react version: ^18.0.0
import { useState, useEffect, useCallback } from 'react';
import { 
  SimulationConfig, 
  SimulationUIState, 
  EnvironmentParameter,
  SimulationDuration 
} from '../types/simulation';
import { apiClient } from '../lib/api-client';
import { getCurrentSession } from '../lib/auth';

/**
 * @requirement McKinsey Simulation
 * Default simulation UI state
 */
const DEFAULT_UI_STATE: SimulationUIState = {
  isSelecting: false,
  selectedSpeciesIds: [],
  timeRemaining: { minutes: 0, seconds: 0 }
};

/**
 * @requirement Simulation Engine
 * Custom hook for managing ecosystem simulation state and operations
 */
export function useSimulation(simulationId?: string) {
  const [simulationState, setSimulationState] = useState<SimulationUIState>(DEFAULT_UI_STATE);

  /**
   * @requirement McKinsey Simulation
   * Initializes a new simulation instance with provided configuration
   */
  const initializeSimulation = useCallback(async (config: SimulationConfig): Promise<string> => {
    const session = await getCurrentSession();
    if (!session) {
      throw new Error('User session required for simulation');
    }

    const response = await apiClient.post<{ id: string }>('/api/simulations', {
      config,
      sessionId: session.access_token
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to initialize simulation');
    }

    setSimulationState({
      isSelecting: true,
      selectedSpeciesIds: config.selectedSpecies.map(species => species.id),
      timeRemaining: config.duration
    });

    return response.data.id;
  }, []);

  /**
   * @requirement Simulation Engine
   * Updates selected species in the current simulation
   */
  const updateSpecies = useCallback(async (speciesIds: string[]): Promise<void> => {
    if (!simulationId) {
      throw new Error('No active simulation');
    }

    const response = await apiClient.post<void>(`/api/simulations/${simulationId}/species`, {
      speciesIds
    });

    if (!response.success) {
      throw new Error('Failed to update species');
    }

    setSimulationState(prev => ({
      ...prev,
      selectedSpeciesIds: speciesIds
    }));
  }, [simulationId]);

  /**
   * @requirement McKinsey Simulation
   * Updates environment parameters for the current simulation
   */
  const updateEnvironment = useCallback(async (params: EnvironmentParameter): Promise<void> => {
    if (!simulationId) {
      throw new Error('No active simulation');
    }

    const response = await apiClient.post<void>(`/api/simulations/${simulationId}/environment`, {
      params
    });

    if (!response.success) {
      throw new Error('Failed to update environment');
    }
  }, [simulationId]);

  /**
   * @requirement Simulation Engine
   * Load initial simulation data if simulationId is provided
   */
  useEffect(() => {
    if (simulationId) {
      const loadSimulation = async () => {
        const response = await apiClient.get<SimulationUIState>(
          `/api/simulations/${simulationId}`
        );

        if (response.success && response.data) {
          setSimulationState(response.data);
        }
      };

      loadSimulation();
    }
  }, [simulationId]);

  /**
   * @requirement McKinsey Simulation
   * Setup timer for tracking remaining simulation time
   */
  useEffect(() => {
    if (!simulationState.timeRemaining.minutes && !simulationState.timeRemaining.seconds) {
      return;
    }

    const timer = setInterval(() => {
      setSimulationState(prev => {
        const newSeconds = prev.timeRemaining.seconds - 1;
        const newMinutes = prev.timeRemaining.minutes + Math.floor(newSeconds / 60);

        if (newMinutes <= 0 && newSeconds <= 0) {
          clearInterval(timer);
          return {
            ...prev,
            timeRemaining: { minutes: 0, seconds: 0 }
          };
        }

        return {
          ...prev,
          timeRemaining: {
            minutes: newMinutes,
            seconds: ((newSeconds % 60) + 60) % 60
          }
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [simulationState.timeRemaining]);

  return {
    simulationState,
    initializeSimulation,
    updateSpecies,
    updateEnvironment,
    timeRemaining: simulationState.timeRemaining
  };
}
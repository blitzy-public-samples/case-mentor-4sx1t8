// react v18.0.0
import { useState, useCallback, useEffect } from 'react';
// zod v3.22.0
import z from 'zod';

import { 
  SimulationState, 
  SimulationStatus, 
  Species, 
  EnvironmentParameters, 
  SimulationResult, 
  SimulationResponse,
  SimulationValidation 
} from '../types/simulation';
import { api } from '../lib/api';
import { useToast, ToastType } from './useToast';

/**
 * Human Tasks:
 * 1. Configure polling interval in environment variables
 * 2. Set up monitoring for simulation performance metrics
 * 3. Configure error tracking for simulation failures
 */

// Polling interval for active simulations in milliseconds
const SIMULATION_POLL_INTERVAL = 1000;

// API endpoints for simulation
const ENDPOINTS = {
  CREATE: '/api/simulation',
  STATUS: (id: string) => `/api/simulation/${id}`,
  SPECIES: (id: string) => `/api/simulation/${id}/species`,
  ENVIRONMENT: (id: string) => `/api/simulation/${id}/environment`,
  START: (id: string) => `/api/simulation/${id}/start`,
  STOP: (id: string) => `/api/simulation/${id}/stop`
};

/**
 * Custom hook for managing ecosystem simulation state and interactions
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * Requirement: Simulation Engine - Handles ecosystem game logic and state management
 */
export const useSimulation = () => {
  // Initialize state with proper types
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  // Fetch current simulation state
  const fetchSimulationState = useCallback(async () => {
    if (!simulationState?.id) return;

    const response = await api.get<SimulationResponse<SimulationState>>(
      ENDPOINTS.STATUS(simulationState.id)
    );

    if (response.success) {
      setSimulationState(response.data.data);
      if (response.data.data.status === SimulationStatus.COMPLETED) {
        const resultResponse = await api.get<SimulationResponse<SimulationResult>>(
          `/api/simulation/${simulationState.id}/result`
        );
        if (resultResponse.success) {
          setSimulationResult(resultResponse.data.data);
        }
      }
    } else {
      setError(response.error?.message || 'Failed to fetch simulation state');
    }
  }, [simulationState?.id]);

  // Set up polling for active simulations
  useEffect(() => {
    if (simulationState?.status === SimulationStatus.RUNNING) {
      const interval = setInterval(fetchSimulationState, SIMULATION_POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [simulationState?.status, fetchSimulationState]);

  // Add species with validation
  const addSpecies = useCallback(async (species: Species) => {
    try {
      setLoading(true);
      setError(null);

      // Validate species data
      const validatedSpecies = await SimulationValidation.speciesSchema.parseAsync(species);

      if (!simulationState?.id) {
        // Create new simulation if none exists
        const createResponse = await api.post<SimulationResponse<SimulationState>>(
          ENDPOINTS.CREATE,
          {}
        );

        if (!createResponse.success) {
          throw new Error(createResponse.error?.message || 'Failed to create simulation');
        }
        setSimulationState(createResponse.data.data);
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        ENDPOINTS.SPECIES(simulationState!.id),
        validatedSpecies
      );

      if (response.success) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: `Added species: ${species.name}`
        });
      } else {
        throw new Error(response.error?.message || 'Failed to add species');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add species';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  // Remove species
  const removeSpecies = useCallback((speciesId: string) => {
    if (!simulationState?.id) return;

    setSimulationState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        species: prev.species.filter(s => s.id !== speciesId)
      };
    });
  }, [simulationState?.id]);

  // Update environment parameters with validation
  const updateEnvironment = useCallback(async (params: EnvironmentParameters) => {
    try {
      setLoading(true);
      setError(null);

      // Validate environment parameters
      const validatedParams = await SimulationValidation.environmentSchema.parseAsync(params);

      if (!simulationState?.id) {
        throw new Error('No active simulation');
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        ENDPOINTS.ENVIRONMENT(simulationState.id),
        validatedParams
      );

      if (response.success) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Environment updated successfully'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to update environment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update environment';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  // Start simulation
  const startSimulation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!simulationState?.id) {
        throw new Error('No active simulation');
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        ENDPOINTS.START(simulationState.id),
        {}
      );

      if (response.success) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Simulation started'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to start simulation');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start simulation';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  // Stop simulation
  const stopSimulation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!simulationState?.id) {
        throw new Error('No active simulation');
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        ENDPOINTS.STOP(simulationState.id),
        {}
      );

      if (response.success) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.INFO,
          message: 'Simulation stopped'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to stop simulation');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop simulation';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  // Reset simulation state
  const resetSimulation = useCallback(() => {
    setSimulationState(null);
    setSimulationResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    simulationState,
    simulationResult,
    loading,
    error,
    addSpecies,
    removeSpecies,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  };
};
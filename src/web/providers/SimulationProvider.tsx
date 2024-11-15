/**
 * Human Tasks:
 * 1. Configure API endpoints for simulation in infrastructure
 * 2. Set up monitoring for simulation performance metrics
 * 3. Configure error tracking for simulation failures
 * 4. Verify environment parameter ranges with domain experts
 */

// react v18.0.0
import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  ReactNode 
} from 'react';

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
import { useToast, ToastType } from '../hooks/useToast';

/**
 * Interface defining the shape of simulation context data and methods
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
interface SimulationContextValue {
  simulationState: SimulationState | null;
  simulationResult: SimulationResult | null;
  addSpecies: (species: Species) => Promise<void>;
  removeSpecies: (speciesId: string) => void;
  updateEnvironment: (params: EnvironmentParameters) => Promise<void>;
  startSimulation: () => Promise<void>;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

// Create context with undefined default value
const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

/**
 * Props interface for SimulationProvider component
 */
interface SimulationProviderProps {
  children: ReactNode;
}

/**
 * Context provider component that manages global state and business logic for the simulation
 * Requirement: Simulation Engine - Handles ecosystem game logic and state management in frontend
 */
export function SimulationProvider({ children }: SimulationProviderProps) {
  // Initialize state
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Initialize toast notifications
  const toast = useToast();

  /**
   * Validates species data against schema
   */
  const validateSpecies = useCallback((species: Species): boolean => {
    try {
      SimulationValidation.speciesSchema.parse(species);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.show({
          type: ToastType.ERROR,
          message: 'Invalid species configuration: ' + error.errors[0].message
        });
      }
      return false;
    }
  }, [toast]);

  /**
   * Validates environment parameters against schema
   */
  const validateEnvironment = useCallback((params: EnvironmentParameters): boolean => {
    try {
      SimulationValidation.environmentSchema.parse(params);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.show({
          type: ToastType.ERROR,
          message: 'Invalid environment parameters: ' + error.errors[0].message
        });
      }
      return false;
    }
  }, [toast]);

  /**
   * Adds a new species to the simulation
   */
  const addSpecies = useCallback(async (species: Species) => {
    if (!simulationState || simulationState.status !== SimulationStatus.SETUP) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot add species: Simulation must be in setup phase'
      });
      return;
    }

    if (!validateSpecies(species)) {
      return;
    }

    try {
      const response = await api.post<SimulationResponse<SimulationState>>(
        '/api/simulation/species',
        { simulationId: simulationState.id, species }
      );

      if (response.success && response.data) {
        setSimulationState(response.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: `Added species: ${species.name}`
        });
      } else if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: `Failed to add species: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [simulationState, validateSpecies, toast]);

  /**
   * Removes a species from the simulation
   */
  const removeSpecies = useCallback((speciesId: string) => {
    if (!simulationState || simulationState.status !== SimulationStatus.SETUP) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot remove species: Simulation must be in setup phase'
      });
      return;
    }

    setSimulationState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        species: prevState.species.filter(s => s.id !== speciesId)
      };
    });

    toast.show({
      type: ToastType.INFO,
      message: 'Species removed from simulation'
    });
  }, [simulationState, toast]);

  /**
   * Updates environment parameters for the simulation
   */
  const updateEnvironment = useCallback(async (params: EnvironmentParameters) => {
    if (!simulationState || simulationState.status !== SimulationStatus.SETUP) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot update environment: Simulation must be in setup phase'
      });
      return;
    }

    if (!validateEnvironment(params)) {
      return;
    }

    try {
      const response = await api.post<SimulationResponse<SimulationState>>(
        '/api/simulation/environment',
        { simulationId: simulationState.id, environment: params }
      );

      if (response.success && response.data) {
        setSimulationState(response.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Environment parameters updated'
        });
      } else if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: `Failed to update environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [simulationState, validateEnvironment, toast]);

  /**
   * Starts the simulation if all requirements are met
   */
  const startSimulation = useCallback(async () => {
    if (!simulationState || simulationState.status !== SimulationStatus.SETUP) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot start simulation: Invalid state'
      });
      return;
    }

    if (simulationState.species.length === 0) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot start simulation: No species added'
      });
      return;
    }

    try {
      const response = await api.post<SimulationResponse<SimulationState>>(
        '/api/simulation/start',
        { simulationId: simulationState.id }
      );

      if (response.success && response.data) {
        setSimulationState(response.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Simulation started'
        });
      } else if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: `Failed to start simulation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [simulationState, toast]);

  /**
   * Stops the current simulation
   */
  const stopSimulation = useCallback(() => {
    if (!simulationState || simulationState.status !== SimulationStatus.RUNNING) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Cannot stop simulation: Simulation is not running'
      });
      return;
    }

    setSimulationState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        status: SimulationStatus.COMPLETED
      };
    });

    toast.show({
      type: ToastType.INFO,
      message: 'Simulation stopped'
    });
  }, [simulationState, toast]);

  /**
   * Resets the simulation to initial state
   */
  const resetSimulation = useCallback(() => {
    setSimulationState(null);
    setSimulationResult(null);
    toast.show({
      type: ToastType.INFO,
      message: 'Simulation reset'
    });
  }, [toast]);

  /**
   * Effect to initialize simulation state
   */
  useEffect(() => {
    async function initializeSimulation() {
      try {
        const response = await api.get<SimulationResponse<SimulationState>>('/api/simulation/new');
        
        if (response.success && response.data) {
          setSimulationState(response.data);
        } else if (response.error) {
          throw new Error(response.error.message);
        }
      } catch (error) {
        toast.show({
          type: ToastType.ERROR,
          message: `Failed to initialize simulation: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    if (!simulationState) {
      initializeSimulation();
    }
  }, [simulationState, toast]);

  // Create context value object
  const contextValue: SimulationContextValue = {
    simulationState,
    simulationResult,
    addSpecies,
    removeSpecies,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  };

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}

/**
 * Custom hook to access simulation context with type safety
 */
export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
}
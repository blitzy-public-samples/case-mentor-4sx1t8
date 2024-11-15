// @ts-check

// Third-party imports
import { z } from 'zod'; // v3.22.0

/**
 * @fileoverview TypeScript type definitions for the McKinsey ecosystem simulation game frontend
 * Addresses requirements:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios
 * - Simulation Engine: Handles ecosystem game logic and state management in frontend
 */

/**
 * Generic response wrapper for simulation API endpoints with type safety
 */
export interface SimulationResponse<T> {
  success: boolean;
  data: T;
  error: { message: string; code: string } | null;
}

/**
 * Enumeration of species types in ecosystem simulation
 */
export enum SpeciesType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER'
}

/**
 * Interface defining a species entity in the ecosystem simulation
 */
export interface Species {
  id: string;
  name: string;
  type: SpeciesType;
  energyRequirement: number;
  reproductionRate: number;
}

/**
 * Interface for configuring environmental conditions in simulation
 */
export interface EnvironmentParameters {
  temperature: number;
  depth: number;
  salinity: number;
  lightLevel: number;
}

/**
 * Enumeration of possible simulation execution states
 */
export enum SimulationStatus {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Interface representing the current state of a simulation instance
 */
export interface SimulationState {
  id: string;
  userId: string;
  species: Species[];
  environment: EnvironmentParameters;
  timeRemaining: number;
  status: SimulationStatus;
}

/**
 * Interface for simulation completion results and performance metrics
 */
export interface SimulationResult {
  simulationId: string;
  score: number;
  ecosystemStability: number;
  speciesBalance: number;
  feedback: string[];
  completedAt: string;
}

/**
 * Zod validation schemas for runtime type checking of simulation parameters
 */
export const SimulationValidation = {
  environmentSchema: z.object({
    temperature: z.number().min(-10).max(40),
    depth: z.number().min(0).max(1000),
    salinity: z.number().min(0).max(50),
    lightLevel: z.number().min(0).max(100)
  }),
  
  speciesSchema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.nativeEnum(SpeciesType),
    energyRequirement: z.number().positive(),
    reproductionRate: z.number().min(0).max(1)
  })
} as const;
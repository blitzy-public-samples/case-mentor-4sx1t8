// @ts-check

// Third-party imports
import { z } from 'zod'; // v3.22.0

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure TypeScript to enable strict mode for proper type checking
 */

// Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
// Requirement: Simulation Components - Simulation Engine handles ecosystem game logic

/**
 * Generic response type for simulation endpoints with type-safe data handling
 */
export interface SimulationResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

/**
 * Enumeration of species types in ecosystem for food chain modeling
 */
export enum SpeciesType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER'
}

/**
 * Interface defining a species in the ecosystem with energy and reproduction parameters
 */
export interface Species {
  id: string;
  name: string;
  type: SpeciesType;
  energyRequirement: number;
  reproductionRate: number;
}

/**
 * Interface for environment configuration parameters affecting species behavior
 */
export interface EnvironmentParameters {
  temperature: number;
  depth: number;
  salinity: number;
  lightLevel: number;
}

/**
 * Enumeration of possible simulation states for lifecycle management
 */
export enum SimulationStatus {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Interface for current simulation state tracking species and environment
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
 * Interface for simulation results including scoring and feedback
 */
export interface SimulationResult {
  simulationId: string;
  score: number;
  ecosystemStability: number;
  speciesBalance: number;
  feedback: string[];
  completedAt: string;
}

// Zod schemas for runtime validation

export const SpeciesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(SpeciesType),
  energyRequirement: z.number().positive().max(1000),
  reproductionRate: z.number().min(0).max(1)
});

export const EnvironmentParametersSchema = z.object({
  temperature: z.number().min(-10).max(40),
  depth: z.number().min(0).max(1000),
  salinity: z.number().min(0).max(50),
  lightLevel: z.number().min(0).max(100)
});

export const SimulationStateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  species: z.array(SpeciesSchema),
  environment: EnvironmentParametersSchema,
  timeRemaining: z.number().min(0),
  status: z.nativeEnum(SimulationStatus)
});

export const SimulationResultSchema = z.object({
  simulationId: z.string().uuid(),
  score: z.number().min(0).max(100),
  ecosystemStability: z.number().min(0).max(100),
  speciesBalance: z.number().min(0).max(100),
  feedback: z.array(z.string()),
  completedAt: z.string().datetime()
});
// Third-party imports
import { z } from 'zod'; // v3.22.0

// Internal imports
import {
  Species,
  Environment as EnvironmentParameters,
  SimulationState,
  SimulationConfig
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Verify TypeScript strict mode is enabled in tsconfig.json
 * 3. Review validation schemas for any environment-specific adjustments
 */

// Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
// Requirement: Simulation Engine - Handles ecosystem game logic and simulation state

/**
 * Defines the execution context for a simulation instance
 */
export interface SimulationExecutionContext {
  userId: string;
  timeLimit: number;
  config: SimulationConfig;
}

/**
 * Enumeration of possible interaction types between species
 */
export enum InteractionType {
  PREDATION = 'PREDATION',
  COMPETITION = 'COMPETITION',
  SYMBIOSIS = 'SYMBIOSIS'
}

/**
 * Defines an interaction between two species in the ecosystem
 */
export interface SpeciesInteraction {
  sourceSpecies: string;
  targetSpecies: string;
  interactionType: InteractionType;
  strength: number;
}

/**
 * Represents the complete state of the ecosystem at a given point in time
 */
export interface EcosystemState {
  species: Species[];
  environment: EnvironmentParameters;
  interactions: SpeciesInteraction[];
  stabilityScore: number;
  timestamp: number;
}

/**
 * Tracks key performance indicators during simulation execution
 */
export interface SimulationMetrics {
  speciesDiversity: number;
  trophicEfficiency: number;
  environmentalStress: number;
  stabilityHistory: number[];
}

/**
 * Structured error type for simulation validation failures
 */
export interface SimulationValidationError {
  code: string;
  message: string;
  details: Record<string, any>;
}

// Zod validation schemas for runtime type checking

export const SimulationExecutionContextSchema = z.object({
  userId: z.string().uuid(),
  timeLimit: z.number().positive().max(3600), // Maximum 1 hour
  config: z.record(z.any()) // Generic config validation
});

export const SpeciesInteractionSchema = z.object({
  sourceSpecies: z.string().uuid(),
  targetSpecies: z.string().uuid(),
  interactionType: z.nativeEnum(InteractionType),
  strength: z.number().min(0).max(1)
});

export const EcosystemStateSchema = z.object({
  species: z.array(z.any()), // Validated by Species schema from simulation.ts
  environment: z.any(), // Validated by Environment schema from simulation.ts
  interactions: z.array(SpeciesInteractionSchema),
  stabilityScore: z.number().min(0).max(100),
  timestamp: z.number().positive()
});

export const SimulationMetricsSchema = z.object({
  speciesDiversity: z.number().min(0).max(100),
  trophicEfficiency: z.number().min(0).max(100),
  environmentalStress: z.number().min(0).max(100),
  stabilityHistory: z.array(z.number().min(0).max(100))
});

export const SimulationValidationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any())
});
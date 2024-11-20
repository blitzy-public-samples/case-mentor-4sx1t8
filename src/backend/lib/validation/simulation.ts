// Third-party imports
import { z } from 'zod'; // v3.22.0

// Internal imports
import { 
  Species, 
  SpeciesType, 
  EnvironmentParameters, 
  SimulationState, 
  SimulationStatus 
} from '../../types/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationValidationError
} from '../simulation/types';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Verify TypeScript strict mode is enabled in tsconfig.json
 * 3. Review validation thresholds for specific deployment environments
 */

// Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
// Requirement: Input Validation - JSON Schema validation for API endpoints and user input

// Zod schemas for validation
export const simulationSchemas = {
  speciesSchema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.nativeEnum(SpeciesType),
    energyRequirement: z.number().min(0).max(100)
      .refine(val => val >= 0 && val <= 100, {
        message: "Energy requirement must be between 0 and 100"
      }),
    reproductionRate: z.number()
      .refine(val => val >= 0.1 && val <= 5.0, {
        message: "Reproduction rate must be between 0.1 and 5.0"
      })
  }),

  environmentSchema: z.object({
    temperature: z.number()
      .refine(val => val >= 0 && val <= 50, {
        message: "Temperature must be between 0°C and 50°C"
      }),
    depth: z.number()
      .refine(val => val >= 0 && val <= 200, {
        message: "Depth must be between 0m and 200m"
      }),
    salinity: z.number()
      .refine(val => val >= 0 && val <= 50, {
        message: "Salinity must be between 0 and 50 cm/s"
      }),
    lightLevel: z.number()
      .refine(val => val >= 0 && val <= 100, {
        message: "Light level must be between 0 and 100"
      })
  }),

  interactionSchema: z.object({
    sourceSpecies: z.string().uuid(),
    targetSpecies: z.string().uuid(),
    interactionType: z.nativeEnum(InteractionType),
    strength: z.number()
      .refine(val => val >= -1 && val <= 1, {
        message: "Interaction strength must be between -1 and 1"
      })
  }),

  simulationStateSchema: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    species: z.array(z.lazy(() => simulationSchemas.speciesSchema)),
    environment: z.lazy(() => simulationSchemas.environmentSchema),
    timeRemaining: z.number().positive(),
    status: z.nativeEnum(SimulationStatus)
  })
};

/**
 * Validates a species configuration against ecosystem rules
 * @param species - Species configuration to validate
 * @returns Promise resolving to true if valid, throws SimulationValidationError if invalid
 */
export async function validateSpecies(species: Species): Promise<boolean> {
  try {
    await simulationSchemas.speciesSchema.parseAsync(species);
    
    // Additional business rule validations
    if (species.type === SpeciesType.PRODUCER && species.energyRequirement > 50) {
      throw new Error("Producers cannot have energy requirement above 50");
    }
    
    return true;
  } catch (error) {
    throw {
      code: "INVALID_SPECIES",
      message: "Species validation failed",
      details: {
        species,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    } as SimulationValidationError;
  }
}

/**
 * Validates environment parameters for simulation
 * @param params - Environment parameters to validate
 * @returns Promise resolving to true if valid, throws SimulationValidationError if invalid
 */
export async function validateEnvironment(params: EnvironmentParameters): Promise<boolean> {
  try {
    await simulationSchemas.environmentSchema.parseAsync(params);
    
    // Additional environmental constraints
    if (params.depth > 100 && params.lightLevel > 50) {
      throw new Error("Light levels cannot exceed 50 at depths greater than 100m");
    }
    
    return true;
  } catch (error) {
    throw {
      code: "INVALID_ENVIRONMENT",
      message: "Environment validation failed",
      details: {
        params,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    } as SimulationValidationError;
  }
}

/**
 * Validates species interaction rules and relationships
 * @param interaction - Species interaction to validate
 * @returns Promise resolving to true if valid, throws SimulationValidationError if invalid
 */
export async function validateInteraction(interaction: SpeciesInteraction): Promise<boolean> {
  try {
    await simulationSchemas.interactionSchema.parseAsync(interaction);
    
    // Prevent self-interaction
    if (interaction.sourceSpecies === interaction.targetSpecies) {
      throw new Error("Species cannot interact with itself");
    }
    
    // Validate interaction type constraints
    if (interaction.interactionType === InteractionType.PREDATION && interaction.strength <= 0) {
      throw new Error("Predation interaction strength must be positive");
    }
    
    return true;
  } catch (error) {
    throw {
      code: "INVALID_INTERACTION",
      message: "Species interaction validation failed",
      details: {
        interaction,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    } as SimulationValidationError;
  }
}

/**
 * Validates complete simulation state including all components
 * @param state - Simulation state to validate
 * @returns Promise resolving to true if valid, throws SimulationValidationError if invalid
 */
export async function validateSimulationState(state: SimulationState): Promise<boolean> {
  try {
    await simulationSchemas.simulationStateSchema.parseAsync(state);
    
    // Validate all species
    await Promise.all(state.species.map(validateSpecies));
    
    // Validate environment
    await validateEnvironment(state.environment);
    
    // Additional state validations
    if (state.status === SimulationStatus.RUNNING && state.timeRemaining <= 0) {
      throw new Error("Running simulation must have positive time remaining");
    }
    
    if (state.species.length < 2) {
      throw new Error("Simulation must have at least 2 species");
    }
    
    return true;
  } catch (error) {
    throw {
      code: "INVALID_SIMULATION_STATE",
      message: "Simulation state validation failed",
      details: {
        state,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    } as SimulationValidationError;
  }
}
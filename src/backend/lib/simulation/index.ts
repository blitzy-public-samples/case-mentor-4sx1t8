/**
 * Human Tasks:
 * 1. Ensure all simulation module dependencies are installed with correct versions
 * 2. Configure monitoring for simulation performance metrics
 * 3. Review and adjust simulation parameters in deployment configuration
 */

// Re-export core simulation functionality
export {
  EcosystemSimulation,
  SimulationEvaluator,
  evaluateEcosystemStability,
  validateSpeciesConfiguration
} from './ecosystem';

// Re-export type definitions
export {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError
} from './types';

/**
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * This module serves as the main entry point for the McKinsey ecosystem simulation,
 * providing a unified interface for simulation execution, evaluation, and feedback generation.
 */

/**
 * @requirement Simulation Engine - Handles ecosystem game logic and simulation state
 * Exports core simulation engine components and type definitions for ecosystem modeling,
 * state management, and evaluation utilities.
 */
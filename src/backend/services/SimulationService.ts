// Third-party imports
import { z } from 'zod'; // ^3.22.0

// Internal imports
import { EcosystemSimulation } from '../lib/simulation/ecosystem';
import { SimulationEvaluator } from '../lib/simulation/evaluator';
import { SimulationAttempt } from '../models/SimulationAttempt';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult
} from '../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Configure environment-specific simulation parameters
 * 2. Set up monitoring for service performance metrics
 * 3. Review and adjust simulation validation thresholds
 * 4. Configure error tracking and alerting
 */

// Input validation schemas
const startSimulationSchema = z.object({
  userId: z.string().uuid(),
  context: z.object({
    timeLimit: z.number().min(300).max(3600), // 5 minutes to 1 hour
    config: z.record(z.any())
  })
});

const updateSpeciesSchema = z.object({
  attemptId: z.string().uuid(),
  species: z.array(z.any()) // Detailed species validation handled by ecosystem
});

const updateEnvironmentSchema = z.object({
  attemptId: z.string().uuid(),
  environment: z.record(z.any()) // Detailed environment validation handled by ecosystem
});

/**
 * Service class managing McKinsey ecosystem simulation lifecycle and business logic
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement Simulation Engine - Handles ecosystem game logic and simulation state
 */
export class SimulationService {
  private simulation: EcosystemSimulation;
  private evaluator: SimulationEvaluator;
  private currentAttempt: SimulationAttempt;

  constructor() {
    this.evaluator = new SimulationEvaluator({} as SimulationExecutionContext); // Context set on start
  }

  /**
   * Starts a new simulation attempt for a user
   */
  async startSimulation(
    userId: string,
    context: SimulationExecutionContext
  ): Promise<SimulationAttempt> {
    try {
      // Validate input parameters
      const { userId: validUserId, context: validContext } = startSimulationSchema.parse({
        userId,
        context
      });

      // Initialize simulation components
      this.simulation = new EcosystemSimulation(validContext);
      this.evaluator = new SimulationEvaluator(validContext);

      // Create initial ecosystem state
      const initialState = await this.simulation.initializeEcosystem(
        [], // Empty species array - will be populated via updateSpecies
        {} as Environment // Default environment - will be updated via updateEnvironment
      );

      // Create and persist simulation attempt
      this.currentAttempt = new SimulationAttempt({
        ...initialState,
        userId: validUserId,
        timeRemaining: validContext.timeLimit
      });
      await this.currentAttempt.save();

      return this.currentAttempt;
    } catch (error) {
      throw new Error(`Failed to start simulation: ${error.message}`);
    }
  }

  /**
   * Updates species selection for current simulation
   */
  async updateSpecies(
    attemptId: string,
    species: Species[]
  ): Promise<SimulationState> {
    try {
      // Validate input parameters
      const { attemptId: validAttemptId, species: validSpecies } = updateSpeciesSchema.parse({
        attemptId,
        species
      });

      // Verify attempt exists and is active
      if (!this.currentAttempt || this.currentAttempt.id !== validAttemptId) {
        throw new Error('Invalid simulation attempt');
      }

      // Initialize ecosystem with new species
      const updatedState = await this.simulation.initializeEcosystem(
        validSpecies,
        this.currentAttempt.environment
      );

      // Update and persist attempt state
      await this.currentAttempt.updateState({
        species: validSpecies,
        ...updatedState
      });

      return updatedState;
    } catch (error) {
      throw new Error(`Failed to update species: ${error.message}`);
    }
  }

  /**
   * Updates environmental parameters for current simulation
   */
  async updateEnvironment(
    attemptId: string,
    environment: Environment
  ): Promise<SimulationState> {
    try {
      // Validate input parameters
      const { attemptId: validAttemptId, environment: validEnvironment } = updateEnvironmentSchema.parse({
        attemptId,
        environment
      });

      // Verify attempt exists and is active
      if (!this.currentAttempt || this.currentAttempt.id !== validAttemptId) {
        throw new Error('Invalid simulation attempt');
      }

      // Initialize ecosystem with new environment
      const updatedState = await this.simulation.initializeEcosystem(
        this.currentAttempt.species,
        validEnvironment
      );

      // Update and persist attempt state
      await this.currentAttempt.updateState({
        environment: validEnvironment,
        ...updatedState
      });

      return updatedState;
    } catch (error) {
      throw new Error(`Failed to update environment: ${error.message}`);
    }
  }

  /**
   * Executes a single time step in the simulation
   */
  async executeTimeStep(attemptId: string): Promise<SimulationState> {
    try {
      // Verify attempt exists and is active
      if (!this.currentAttempt || this.currentAttempt.id !== attemptId) {
        throw new Error('Invalid simulation attempt');
      }

      // Execute simulation step
      await this.simulation.simulateTimeStep();

      // Get updated state
      const currentState = await this.simulation.getSimulationResult();

      // Update attempt state
      await this.currentAttempt.updateState({
        timeRemaining: this.currentAttempt.timeRemaining - 1,
        ...currentState
      });

      return currentState;
    } catch (error) {
      if (error.message.includes('SIMULATION_COMPLETE')) {
        // Handle normal simulation completion
        return this.completeSimulation(attemptId);
      }
      throw new Error(`Failed to execute time step: ${error.message}`);
    }
  }

  /**
   * Completes the simulation and generates final results
   */
  async completeSimulation(attemptId: string): Promise<SimulationResult> {
    try {
      // Verify attempt exists and is active
      if (!this.currentAttempt || this.currentAttempt.id !== attemptId) {
        throw new Error('Invalid simulation attempt');
      }

      // Get final simulation results
      const finalResult = await this.simulation.getSimulationResult();

      // Evaluate simulation performance
      const evaluatedResult = await this.evaluator.evaluateAttempt(
        this.currentAttempt,
        {
          speciesDiversity: finalResult.speciesBalance,
          trophicEfficiency: finalResult.ecosystemStability,
          environmentalStress: 100 - finalResult.score,
          stabilityHistory: [] // History tracked internally by simulation
        }
      );

      // Complete attempt with final results
      await this.currentAttempt.complete(evaluatedResult);

      return evaluatedResult;
    } catch (error) {
      throw new Error(`Failed to complete simulation: ${error.message}`);
    }
  }
}
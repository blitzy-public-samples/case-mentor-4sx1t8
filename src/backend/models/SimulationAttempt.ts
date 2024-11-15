// Third-party imports
import { z } from 'zod'; // ^3.22.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import { 
  SimulationState, 
  SimulationStatus, 
  SimulationResult,
  SimulationStateSchema,
  SimulationResultSchema
} from '../types/simulation';
import { executeQuery, withTransaction } from '../utils/database';

/**
 * Human Tasks:
 * 1. Ensure Supabase project has the simulation_attempts table created with correct schema
 * 2. Configure appropriate database indexes for userId and status columns
 * 3. Set up monitoring for simulation performance metrics
 * 4. Verify rate limiting rules for simulation attempts
 */

/**
 * Model class representing a McKinsey ecosystem simulation attempt
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement Simulation Components - Simulation Engine handles ecosystem game logic
 */
export class SimulationAttempt {
  public id: string;
  public userId: string;
  public species: Species[];
  public environment: EnvironmentParameters;
  public timeRemaining: number;
  public status: SimulationStatus;
  public createdAt: Date;
  public updatedAt: Date;

  /**
   * Creates a new simulation attempt instance
   * @param state Initial simulation state
   */
  constructor(state: SimulationState) {
    // Validate input state using schema
    const validatedState = SimulationStateSchema.parse(state);

    // Initialize instance properties
    this.id = validatedState.id;
    this.userId = validatedState.userId;
    this.species = validatedState.species;
    this.environment = validatedState.environment;
    this.timeRemaining = validatedState.timeRemaining;
    this.status = SimulationStatus.SETUP;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Additional validation for species array
    if (this.species.length < 3 || this.species.length > 8) {
      throw new Error('Species count must be between 3 and 8');
    }
  }

  /**
   * Persists the simulation attempt to the database
   * @returns Promise resolving to saved simulation attempt
   */
  async save(): Promise<SimulationAttempt> {
    // Validate current state before saving
    const currentState: SimulationState = {
      id: this.id,
      userId: this.userId,
      species: this.species,
      environment: this.environment,
      timeRemaining: this.timeRemaining,
      status: this.status
    };
    SimulationStateSchema.parse(currentState);

    // Execute database transaction
    await withTransaction(async () => {
      const query = `
        INSERT INTO simulation_attempts (
          id, user_id, species, environment, time_remaining, 
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          species = EXCLUDED.species,
          environment = EXCLUDED.environment,
          time_remaining = EXCLUDED.time_remaining,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const params = [
        this.id,
        this.userId,
        JSON.stringify(this.species),
        JSON.stringify(this.environment),
        this.timeRemaining,
        this.status,
        this.createdAt.toISOString(),
        new Date().toISOString()
      ];

      await executeQuery(query, params);
    });

    this.updatedAt = new Date();
    return this;
  }

  /**
   * Updates the simulation state with new values
   * @param updates Partial state updates to apply
   * @returns Promise resolving to updated simulation attempt
   */
  async updateState(updates: Partial<SimulationState>): Promise<SimulationAttempt> {
    // Validate update payload
    const validatedUpdates = z.object({
      species: z.array(z.any()).optional(),
      environment: z.object({}).passthrough().optional(),
      timeRemaining: z.number().min(0).optional(),
      status: z.nativeEnum(SimulationStatus).optional()
    }).parse(updates);

    // Merge updates with current state
    Object.assign(this, validatedUpdates);
    this.updatedAt = new Date();

    // Save changes to database
    await this.save();

    return this;
  }

  /**
   * Marks the simulation as completed and stores results
   * @param result Final simulation results
   * @returns Promise resolving to simulation results
   */
  async complete(result: SimulationResult): Promise<SimulationResult> {
    // Validate simulation can be completed
    if (this.status === SimulationStatus.COMPLETED) {
      throw new Error('Simulation already completed');
    }
    if (this.timeRemaining > 0) {
      throw new Error('Simulation time not expired');
    }

    // Validate result data
    const validatedResult = SimulationResultSchema.parse({
      ...result,
      simulationId: this.id,
      completedAt: new Date().toISOString()
    });

    // Update simulation status
    await this.updateState({ status: SimulationStatus.COMPLETED });

    // Store results in database
    await withTransaction(async () => {
      const query = `
        INSERT INTO simulation_results (
          simulation_id, score, ecosystem_stability,
          species_balance, feedback, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const params = [
        validatedResult.simulationId,
        validatedResult.score,
        validatedResult.ecosystemStability,
        validatedResult.speciesBalance,
        JSON.stringify(validatedResult.feedback),
        validatedResult.completedAt
      ];

      await executeQuery(query, params);
    });

    return validatedResult;
  }
}
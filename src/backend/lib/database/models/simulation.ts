/**
 * Core simulation model class for McKinsey ecosystem simulation game
 * Human Tasks:
 * 1. Ensure Supabase database has 'simulations' table with required columns
 * 2. Configure appropriate RLS policies for simulation data access
 * 3. Set up database triggers for simulation state updates
 * 4. Configure backup policy for simulation data
 */

import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // ^0.37.2
import { 
  Species, 
  SimulationState, 
  SimulationResult, 
  EnvironmentParameter, 
  SimulationStatus, 
  SimulationScore, 
  SimulationDuration 
} from '../../../types/simulation';
import { supabase, handleDatabaseError } from '../../../config/database';

/**
 * Core model class for managing ecosystem simulation data and operations
 * Requirement: McKinsey Simulation - Ecosystem game replication, time-pressured scenarios
 */
export class SimulationModel {
  private _db = supabase;
  private TABLE_NAME = 'simulations';

  constructor() {
    // Database connection is initialized via imported supabase instance
  }

  /**
   * Creates a new simulation instance with initial state
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  async createSimulation(
    userId: string,
    selectedSpecies: Species[],
    environment: EnvironmentParameter
  ): Promise<SimulationState> {
    try {
      // Validate user ID
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }

      // Validate selected species
      if (!Array.isArray(selectedSpecies) || selectedSpecies.length === 0) {
        throw new Error('At least one species must be selected');
      }

      // Validate environment parameters
      this.validateEnvironmentParameters(environment);

      // Generate unique simulation ID
      const simulationId = uuidv4();

      // Create initial simulation state
      const initialState: SimulationState = {
        id: simulationId,
        userId,
        selectedSpecies,
        environment,
        timeRemaining: {
          minutes: 30,
          seconds: 0
        },
        score: {
          speciesBalance: 0,
          survivalRate: 0,
          ecosystemStability: 0,
          totalScore: 0
        },
        isComplete: false,
        startedAt: new Date(),
        completedAt: null
      };

      // Insert record into database
      const { data, error } = await this._db
        .from(this.TABLE_NAME)
        .insert(initialState)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as SimulationState;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Retrieves a simulation by its ID
   * Requirement: System Performance - Support <200ms API response time
   */
  async getSimulationById(simulationId: string): Promise<SimulationState> {
    try {
      // Validate simulation ID format
      if (!simulationId || typeof simulationId !== 'string') {
        throw new Error('Invalid simulation ID');
      }

      // Query database for simulation record
      const { data, error } = await this._db
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', simulationId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Simulation not found');
      }

      return data as SimulationState;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Updates the state of an ongoing simulation
   * Requirement: McKinsey Simulation - Time-pressured scenarios
   */
  async updateSimulationState(
    simulationId: string,
    newState: Partial<SimulationState>
  ): Promise<SimulationState> {
    try {
      // Validate simulation ID
      if (!simulationId || typeof simulationId !== 'string') {
        throw new Error('Invalid simulation ID');
      }

      // Check if simulation exists and is not complete
      const currentState = await this.getSimulationById(simulationId);
      if (currentState.isComplete) {
        throw new Error('Cannot update completed simulation');
      }

      // Update simulation record
      const { data, error } = await this._db
        .from(this.TABLE_NAME)
        .update({
          ...newState,
          updatedAt: new Date()
        })
        .eq('id', simulationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as SimulationState;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Marks a simulation as complete and stores results
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  async completeSimulation(
    simulationId: string,
    result: SimulationResult
  ): Promise<SimulationResult> {
    try {
      // Validate simulation ID
      if (!simulationId || typeof simulationId !== 'string') {
        throw new Error('Invalid simulation ID');
      }

      // Validate result object
      this.validateSimulationResult(result);

      // Update simulation status
      const { data, error } = await this._db
        .from(this.TABLE_NAME)
        .update({
          isComplete: true,
          completedAt: new Date(),
          score: result.score,
          survivingSpecies: result.survivingSpecies,
          feedback: result.feedback,
          ecosystemSurvived: result.ecosystemSurvived,
          timeElapsedSeconds: result.timeElapsedSeconds,
          status: SimulationStatus.COMPLETED
        })
        .eq('id', simulationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Validates environment parameters are within acceptable ranges
   * @private
   */
  private validateEnvironmentParameters(params: EnvironmentParameter): void {
    const { temperature, depth, salinity, lightLevel } = params;

    if (
      typeof temperature !== 'number' ||
      temperature < -5 ||
      temperature > 40
    ) {
      throw new Error('Temperature must be between -5°C and 40°C');
    }

    if (
      typeof depth !== 'number' ||
      depth < 0 ||
      depth > 1000
    ) {
      throw new Error('Depth must be between 0m and 1000m');
    }

    if (
      typeof salinity !== 'number' ||
      salinity < 0 ||
      salinity > 50
    ) {
      throw new Error('Salinity must be between 0 and 50 PSU');
    }

    if (
      typeof lightLevel !== 'number' ||
      lightLevel < 0 ||
      lightLevel > 100
    ) {
      throw new Error('Light level must be between 0 and 100%');
    }
  }

  /**
   * Validates simulation result object structure
   * @private
   */
  private validateSimulationResult(result: SimulationResult): void {
    const requiredFields = [
      'simulationId',
      'score',
      'survivingSpecies',
      'feedback',
      'ecosystemSurvived',
      'timeElapsedSeconds'
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (
      typeof result.score !== 'object' ||
      typeof result.score.totalScore !== 'number' ||
      typeof result.score.speciesBalance !== 'number' ||
      typeof result.score.survivalRate !== 'number' ||
      typeof result.score.ecosystemStability !== 'number'
    ) {
      throw new Error('Invalid score object structure');
    }

    if (!Array.isArray(result.survivingSpecies)) {
      throw new Error('Surviving species must be an array');
    }

    if (!Array.isArray(result.feedback)) {
      throw new Error('Feedback must be an array of strings');
    }

    if (typeof result.ecosystemSurvived !== 'boolean') {
      throw new Error('Ecosystem survived must be a boolean');
    }

    if (
      typeof result.timeElapsedSeconds !== 'number' ||
      result.timeElapsedSeconds < 0
    ) {
      throw new Error('Invalid time elapsed value');
    }
  }
}
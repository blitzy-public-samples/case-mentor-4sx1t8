import { 
  Species, 
  SimulationState, 
  SimulationResult, 
  SpeciesType, 
  EnvironmentParameter, 
  SimulationStatus 
} from '../../../types/simulation';
import { supabase, handleDatabaseError } from '../../../config/database';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // ^0.37.2

/**
 * Human Tasks:
 * 1. Create database indexes for optimized queries:
 *    - CREATE INDEX idx_simulations_user_id ON simulations(user_id);
 *    - CREATE INDEX idx_simulations_status ON simulations(status);
 *    - CREATE INDEX idx_simulations_created_at ON simulations(created_at);
 * 2. Set up real-time subscriptions for simulation state updates
 * 3. Configure proper RLS policies for simulation data access
 */

/**
 * Creates a new simulation instance with initial configuration
 * Requirement: McKinsey Simulation - Ecosystem game replication
 */
export async function createSimulation(
  userId: string,
  selectedSpecies: Species[],
  environment: EnvironmentParameter
): Promise<SimulationState> {
  try {
    const simulationData = {
      id: crypto.randomUUID(),
      user_id: userId,
      selected_species: selectedSpecies,
      environment,
      status: SimulationStatus.NOT_STARTED,
      time_remaining: { minutes: 30, seconds: 0 },
      score: {
        speciesBalance: 0,
        survivalRate: 0,
        ecosystemStability: 0,
        totalScore: 0
      },
      started_at: new Date().toISOString(),
      completed_at: null,
      version: 1 // For optimistic locking
    };

    const { data, error } = await supabase
      .from('simulations')
      .insert(simulationData)
      .select('*')
      .single();

    if (error) throw error;
    return data as SimulationState;
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Retrieves simulation by ID with optimized query
 * Requirement: System Performance - Support <200ms API response time
 */
export async function getSimulationById(simulationId: string): Promise<SimulationState> {
  try {
    const { data, error } = await supabase
      .from('simulations')
      .select(`
        *,
        selected_species:species_configurations(*),
        environment:environment_parameters(*)
      `)
      .eq('id', simulationId)
      .single();

    if (error) throw error;
    return data as SimulationState;
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Updates simulation state with real-time broadcast
 * Requirements: 
 * - McKinsey Simulation - Complex data analysis
 * - System Performance - Optimized database queries
 */
export async function updateSimulationState(
  simulationId: string,
  newState: SimulationState
): Promise<SimulationState> {
  try {
    const { data: currentState, error: fetchError } = await supabase
      .from('simulations')
      .select('version')
      .eq('id', simulationId)
      .eq('status', SimulationStatus.IN_PROGRESS)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('simulations')
      .update({
        ...newState,
        version: (currentState.version || 0) + 1
      })
      .eq('id', simulationId)
      .eq('version', currentState.version)
      .select()
      .single();

    if (error) throw error;

    // Broadcast state change via real-time
    await supabase.rpc('broadcast_simulation_update', {
      simulation_id: simulationId,
      new_state: data
    });

    return data as SimulationState;
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Completes simulation and stores final results
 * Requirement: McKinsey Simulation - Complex data analysis
 */
export async function completeSimulation(
  simulationId: string,
  result: SimulationResult
): Promise<SimulationResult> {
  try {
    const { data, error } = await supabase
      .from('simulations')
      .update({
        status: SimulationStatus.COMPLETED,
        completed_at: new Date().toISOString(),
        score: result.score,
        surviving_species: result.survivingSpecies,
        ecosystem_survived: result.ecosystemSurvived,
        time_elapsed_seconds: result.timeElapsedSeconds,
        feedback: result.feedback
      })
      .eq('id', simulationId)
      .select()
      .single();

    if (error) throw error;
    return data as SimulationResult;
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Retrieves paginated user simulations with filtering
 * Requirements:
 * - System Performance - Optimized queries
 * - McKinsey Simulation - Time-pressured scenarios
 */
export async function getUserSimulations(
  userId: string,
  filters: {
    status?: SimulationStatus;
    startDate?: Date;
    endDate?: Date;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{ data: SimulationState[]; count: number }> {
  try {
    let query = supabase
      .from('simulations')
      .select('*, selected_species:species_configurations(*)', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Apply pagination
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(
        pagination.page * pagination.limit,
        (pagination.page + 1) * pagination.limit - 1
      );

    if (error) throw error;
    return { 
      data: data as SimulationState[],
      count: count || 0
    };
  } catch (error) {
    throw handleDatabaseError(error);
  }
}

/**
 * Deletes simulation with cascading cleanup
 * Requirement: System Performance - Optimized database operations
 */
export async function deleteSimulation(
  simulationId: string,
  userId: string
): Promise<void> {
  try {
    const { error: verifyError } = await supabase
      .from('simulations')
      .select('id')
      .eq('id', simulationId)
      .eq('user_id', userId)
      .single();

    if (verifyError) throw verifyError;

    // Begin transaction for cascading delete
    const { error } = await supabase.rpc('delete_simulation_cascade', {
      simulation_id: simulationId
    });

    if (error) throw error;

    // Clear any cached data
    await supabase.rpc('clear_simulation_cache', {
      simulation_id: simulationId
    });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}
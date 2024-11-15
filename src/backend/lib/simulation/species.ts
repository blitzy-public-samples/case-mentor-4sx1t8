/**
 * Core module for defining and managing species behavior in the McKinsey ecosystem simulation game.
 * 
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with complex species interactions
 * - Simulation Engine: Handles ecosystem game logic for species behavior
 */

// zod v3.22.0
import { z } from 'zod';
import { Species, SpeciesType, EnvironmentParameter } from '../../types/simulation';
import { validateRequest } from '../utils/validation';

// Constants for species configuration bounds
const INITIAL_POPULATION_MIN = 10;
const INITIAL_POPULATION_MAX = 100;
const REPRODUCTION_RATE_MIN = 0.1;
const REPRODUCTION_RATE_MAX = 2.0;
const ENERGY_CONSUMPTION_MIN = 1;
const ENERGY_CONSUMPTION_MAX = 10;

// Species configuration validation schema
const speciesSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['PRODUCER', 'CONSUMER', 'DECOMPOSER']),
  populationSize: z.number().min(INITIAL_POPULATION_MIN).max(INITIAL_POPULATION_MAX).optional(),
  preySpecies: z.array(z.string()).optional(),
  energyConsumption: z.number().min(ENERGY_CONSUMPTION_MIN).max(ENERGY_CONSUMPTION_MAX).optional(),
  reproductionRate: z.number().min(REPRODUCTION_RATE_MIN).max(REPRODUCTION_RATE_MAX).optional()
});

/**
 * Creates a new species instance with validated configuration
 * Requirement: McKinsey Simulation - Ecosystem game replication
 */
export async function createSpecies(speciesConfig: Partial<Species>): Promise<Species> {
  const validatedConfig = await validateRequest(speciesConfig, speciesSchema);
  
  const species: Species = {
    id: validatedConfig.id || `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: validatedConfig.name,
    type: validatedConfig.type,
    populationSize: validatedConfig.populationSize || INITIAL_POPULATION_MIN,
    preySpecies: validatedConfig.preySpecies || [],
    energyConsumption: validatedConfig.energyConsumption || ENERGY_CONSUMPTION_MIN,
    reproductionRate: validatedConfig.reproductionRate || REPRODUCTION_RATE_MIN
  };

  return species;
}

/**
 * Calculates population change based on environmental factors and interactions
 * Requirement: Simulation Engine - Game logic
 */
export function calculatePopulationChange(
  species: Species,
  environment: EnvironmentParameter,
  otherSpecies: Species[]
): number {
  let populationChange = species.populationSize;
  
  // Base reproduction calculation
  const baseGrowth = species.populationSize * species.reproductionRate;
  
  // Environmental modifiers
  const environmentalFactor = calculateEnvironmentalFactor(species, environment);
  
  // Predator-prey interactions
  const predationFactor = calculatePredationFactor(species, otherSpecies);
  
  // Resource competition
  const competitionFactor = calculateCompetitionFactor(species, otherSpecies);
  
  // Apply all factors
  populationChange += baseGrowth * environmentalFactor * predationFactor * competitionFactor;
  
  // Ensure population stays within bounds
  return Math.max(0, Math.min(INITIAL_POPULATION_MAX, Math.round(populationChange)));
}

/**
 * Validates ecological balance of selected species
 * Requirement: McKinsey Simulation - Complex species interactions
 */
export function validateSpeciesBalance(selectedSpecies: Species[]): boolean {
  if (selectedSpecies.length === 0) return false;

  // Check producer presence
  const producers = selectedSpecies.filter(s => s.type === 'PRODUCER');
  if (producers.length === 0) return false;

  // Check consumer presence and ratio
  const consumers = selectedSpecies.filter(s => s.type === 'CONSUMER');
  if (consumers.length > 0 && producers.length / consumers.length < 0.5) return false;

  // Verify food chain completeness
  const allSpeciesIds = new Set(selectedSpecies.map(s => s.id));
  const validFoodChain = consumers.every(consumer => 
    consumer.preySpecies.some(preyId => allSpeciesIds.has(preyId))
  );

  if (!validFoodChain) return false;

  // Validate population distribution
  const totalPopulation = selectedSpecies.reduce((sum, s) => sum + s.populationSize, 0);
  const averagePopulation = totalPopulation / selectedSpecies.length;
  
  const balancedPopulation = selectedSpecies.every(s => 
    Math.abs(s.populationSize - averagePopulation) <= INITIAL_POPULATION_MAX * 0.3
  );

  return balancedPopulation;
}

/**
 * Species manager class for handling species lifecycle and interactions
 * Requirement: Simulation Engine - Game logic
 */
export class SpeciesManager {
  private activeSpecies: Map<string, Species>;
  private environment: EnvironmentParameter;

  constructor(environment: EnvironmentParameter) {
    this.activeSpecies = new Map<string, Species>();
    this.environment = environment;
  }

  /**
   * Adds new species to simulation
   */
  async addSpecies(species: Species): Promise<void> {
    // Validate species configuration
    await validateRequest(species, speciesSchema);

    // Check ecosystem balance
    const updatedSpeciesList = [...this.activeSpecies.values(), species];
    if (!validateSpeciesBalance(updatedSpeciesList)) {
      throw new Error('Adding this species would disrupt ecosystem balance');
    }

    this.activeSpecies.set(species.id, species);
  }

  /**
   * Updates all species populations for one time step
   */
  updatePopulations(): Map<string, number> {
    const updatedPopulations = new Map<string, number>();
    const speciesList = Array.from(this.activeSpecies.values());

    for (const species of this.activeSpecies.values()) {
      const newPopulation = calculatePopulationChange(
        species,
        this.environment,
        speciesList.filter(s => s.id !== species.id)
      );

      if (newPopulation > 0) {
        updatedPopulations.set(species.id, newPopulation);
        this.activeSpecies.get(species.id)!.populationSize = newPopulation;
      } else {
        // Species extinction
        this.activeSpecies.delete(species.id);
      }
    }

    return updatedPopulations;
  }
}

// Private helper functions
function calculateEnvironmentalFactor(species: Species, environment: EnvironmentParameter): number {
  let factor = 1.0;

  switch (species.type) {
    case 'PRODUCER':
      factor *= Math.min(1, environment.lightLevel / 100);
      break;
    case 'CONSUMER':
      factor *= (1 - Math.abs(0.5 - environment.temperature / 100));
      break;
    case 'DECOMPOSER':
      factor *= Math.min(1, environment.depth / 100);
      break;
  }

  return Math.max(0.1, factor);
}

function calculatePredationFactor(species: Species, otherSpecies: Species[]): number {
  if (species.type === 'PRODUCER') {
    const predators = otherSpecies.filter(s => s.preySpecies.includes(species.id));
    return Math.max(0.1, 1 - (predators.length * 0.1));
  }

  const preyPopulation = otherSpecies
    .filter(s => species.preySpecies.includes(s.id))
    .reduce((sum, s) => sum + s.populationSize, 0);

  return preyPopulation > 0 ? Math.min(2, preyPopulation / (species.populationSize * 10)) : 0.1;
}

function calculateCompetitionFactor(species: Species, otherSpecies: Species[]): number {
  const competitors = otherSpecies.filter(s => 
    s.type === species.type && 
    s.energyConsumption >= species.energyConsumption
  );

  const competitionIntensity = competitors.reduce((sum, c) => 
    sum + (c.populationSize * c.energyConsumption), 0
  );

  return Math.max(0.1, 1 - (competitionIntensity / (1000 * species.energyConsumption)));
}
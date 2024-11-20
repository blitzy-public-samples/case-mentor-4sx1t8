// Third-party imports
import { z } from 'zod'; // v3.22.0

// Internal imports
import {
  Species,
  SpeciesType,
  EnvironmentParameters,
  SimulationState,
  SimulationStatus,
  SimulationResult,
  EnvironmentParametersSchema,
  SpeciesSchema
} from '../../types/simulation';

import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationExecutionContextSchema,
  EcosystemStateSchema,
  SimulationMetricsSchema
} from './types';

import { APIError } from '../errors/APIError';

/**
 * Human Tasks:
 * 1. Configure environment-specific simulation parameters in deployment config
 * 2. Set up monitoring for simulation performance metrics
 * 3. Review and adjust species interaction coefficients based on domain expertise
 */

// Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
// Requirement: Simulation Engine - Handles ecosystem game logic and simulation state

export class EcosystemSimulation {
  private state: EcosystemState;
  private metrics: SimulationMetrics;
  private startTime: number;
  private readonly context: SimulationExecutionContext;

  constructor(context: SimulationExecutionContext) {
    // Validate context using zod schema
    const validatedContext = SimulationExecutionContextSchema.parse(context);

    // Initialize empty ecosystem state
    this.state = {
      species: [],
      environment: {
        temperature: 0,
        depth: 0,
        salinity: 0,
        lightLevel: 0
      },
      interactions: [],
      stabilityScore: 0,
      timestamp: Date.now()
    };

    // Initialize metrics tracking
    this.metrics = {
      speciesDiversity: 0,
      trophicEfficiency: 0,
      environmentalStress: 0,
      stabilityHistory: []
    };

    this.startTime = Date.now();
    this.context = validatedContext;
  }

  async initializeEcosystem(
    selectedSpecies: Species[],
    environment: EnvironmentParameters
  ): Promise<EcosystemState> {
    try {
      // Validate input parameters
      const validatedSpecies = z.array(SpeciesSchema).parse(selectedSpecies);
      const validatedEnvironment = EnvironmentParametersSchema.parse(environment);

      // Verify minimum species requirements
      if (validatedSpecies.length < 2) {
        throw new APIError(
          'VALIDATION_ERROR',
          'Minimum of 2 species required for simulation',
          { speciesCount: validatedSpecies.length },
          this.context.userId
        );
      }

      // Calculate species interactions
      const interactions: SpeciesInteraction[] = [];
      for (const source of validatedSpecies) {
        for (const target of validatedSpecies) {
          if (source.id === target.id) continue;

          const interaction = this.calculateSpeciesInteraction(source, target);
          interactions.push(interaction);
        }
      }

      // Set up initial ecosystem state
      this.state = {
        species: validatedSpecies,
        environment: validatedEnvironment,
        interactions,
        stabilityScore: this.calculateInitialStabilityScore(validatedSpecies, validatedEnvironment),
        timestamp: Date.now()
      };

      // Initialize stability metrics
      this.metrics = {
        speciesDiversity: this.calculateSpeciesDiversity(),
        trophicEfficiency: this.calculateTrophicEfficiency(),
        environmentalStress: this.calculateEnvironmentalStress(),
        stabilityHistory: [this.state.stabilityScore]
      };

      return EcosystemStateSchema.parse(this.state);
    } catch (error) {
      throw new APIError(
        'SIMULATION_ERROR',
        'Failed to initialize ecosystem',
        { error },
        this.context.userId
      );
    }
  }

  async simulateTimeStep(): Promise<void> {
    try {
      const { species, environment, interactions } = this.state;

      // Update species populations based on interactions
      for (const currentSpecies of species) {
        const speciesInteractions = interactions.filter(
          i => i.sourceSpecies === currentSpecies.id
        );
        
        const populationChange = this.calculatePopulationChange(
          currentSpecies,
          speciesInteractions,
          environment
        );

        // Apply population changes
        currentSpecies.energyRequirement = Math.max(
          0,
          currentSpecies.energyRequirement + populationChange
        );
      }

      // Update stability metrics
      this.metrics.speciesDiversity = this.calculateSpeciesDiversity();
      this.metrics.trophicEfficiency = this.calculateTrophicEfficiency();
      this.metrics.environmentalStress = this.calculateEnvironmentalStress();

      // Calculate new stability score
      const newStabilityScore = this.calculateStabilityScore();
      this.state.stabilityScore = newStabilityScore;
      this.metrics.stabilityHistory.push(newStabilityScore);

      // Update timestamp
      this.state.timestamp = Date.now();

      // Check simulation completion conditions
      if (this.shouldEndSimulation()) {
        throw new APIError(
          'SIMULATION_COMPLETE',
          'Simulation has reached completion criteria',
          { finalScore: newStabilityScore },
          this.context.userId
        );
      }
    } catch (error) {
      throw new APIError(
        'SIMULATION_ERROR',
        'Error during simulation time step',
        { error },
        this.context.userId
      );
    }
  }

  calculateStabilityScore(): number {
    const weights = {
      diversity: 0.3,
      trophic: 0.3,
      environmental: 0.4
    };

    return Math.round(
      weights.diversity * this.metrics.speciesDiversity +
      weights.trophic * this.metrics.trophicEfficiency +
      weights.environmental * (100 - this.metrics.environmentalStress)
    );
  }

  async getSimulationResult(): Promise<SimulationResult> {
    const finalScore = this.calculateStabilityScore();
    const speciesBalance = this.calculateSpeciesBalance();
    
    return {
      simulationId: this.context.userId,
      score: finalScore,
      ecosystemStability: this.state.stabilityScore,
      speciesBalance,
      feedback: this.generateFeedback(finalScore, speciesBalance),
      completedAt: new Date().toISOString()
    };
  }

  private calculateSpeciesInteraction(source: Species, target: Species): SpeciesInteraction {
    let interactionType: InteractionType;
    let strength: number;

    if (source.type === SpeciesType.PRODUCER && target.type === SpeciesType.CONSUMER) {
      interactionType = InteractionType.PREDATION;
      strength = 0.7;
    } else if (source.type === target.type) {
      interactionType = InteractionType.COMPETITION;
      strength = 0.3;
    } else {
      interactionType = InteractionType.SYMBIOSIS;
      strength = 0.5;
    }

    return {
      sourceSpecies: source.id,
      targetSpecies: target.id,
      interactionType,
      strength
    };
  }

  private calculateInitialStabilityScore(species: Species[], environment: EnvironmentParameters): number {
    const diversityScore = (species.length / 10) * 100;
    const environmentScore = this.calculateEnvironmentalScore(environment);
    return Math.round((diversityScore + environmentScore) / 2);
  }

  private calculateSpeciesDiversity(): number {
    const producerCount = this.state.species.filter(s => s.type === SpeciesType.PRODUCER).length;
    const consumerCount = this.state.species.filter(s => s.type === SpeciesType.CONSUMER).length;
    return Math.min(100, ((producerCount + consumerCount) / 10) * 100);
  }

  private calculateTrophicEfficiency(): number {
    const producers = this.state.species.filter(s => s.type === SpeciesType.PRODUCER);
    const consumers = this.state.species.filter(s => s.type === SpeciesType.CONSUMER);
    
    const producerEnergy = producers.reduce((sum, p) => sum + p.energyRequirement, 0);
    const consumerEnergy = consumers.reduce((sum, c) => sum + c.energyRequirement, 0);
    
    return Math.min(100, (consumerEnergy / producerEnergy) * 100);
  }

  private calculateEnvironmentalStress(): number {
    const { temperature, depth, salinity, lightLevel } = this.state.environment;
    
    const stressFactors = [
      Math.abs(temperature - 20) / 30,
      Math.abs(depth - 500) / 500,
      Math.abs(salinity - 25) / 25,
      Math.abs(lightLevel - 50) / 50
    ];

    return Math.min(100, (stressFactors.reduce((sum, factor) => sum + factor, 0) / 4) * 100);
  }

  private calculatePopulationChange(
    species: Species,
    interactions: SpeciesInteraction[],
    environment: EnvironmentParameters
  ): number {
    const baseChange = species.reproductionRate * 0.1;
    const interactionEffect = interactions.reduce((sum, i) => sum + (i.strength * 0.05), 0);
    const environmentalStress = this.calculateEnvironmentalStress() / 100;

    return baseChange + interactionEffect - environmentalStress;
  }

  private calculateEnvironmentalScore(environment: EnvironmentParameters): number {
    const { temperature, depth, salinity, lightLevel } = environment;
    
    const optimalConditions = {
      temperature: 20,
      depth: 500,
      salinity: 25,
      lightLevel: 50
    };

    const deviations = [
      Math.abs(temperature - optimalConditions.temperature) / 30,
      Math.abs(depth - optimalConditions.depth) / 500,
      Math.abs(salinity - optimalConditions.salinity) / 25,
      Math.abs(lightLevel - optimalConditions.lightLevel) / 50
    ];

    return 100 - (deviations.reduce((sum, dev) => sum + dev, 0) / 4 * 100);
  }

  private calculateSpeciesBalance(): number {
    const producers = this.state.species.filter(s => s.type === SpeciesType.PRODUCER);
    const consumers = this.state.species.filter(s => s.type === SpeciesType.CONSUMER);
    
    const producerEnergy = producers.reduce((sum, p) => sum + p.energyRequirement, 0);
    const consumerEnergy = consumers.reduce((sum, c) => sum + c.energyRequirement, 0);
    
    const ratio = producerEnergy > 0 ? consumerEnergy / producerEnergy : 0;
    return Math.min(100, Math.abs(1 - ratio) * 100);
  }

  private generateFeedback(finalScore: number, speciesBalance: number): string[] {
    const feedback: string[] = [];

    if (finalScore >= 80) {
      feedback.push("Excellent ecosystem management! The system shows high stability and balance.");
    } else if (finalScore >= 60) {
      feedback.push("Good ecosystem balance, but there's room for improvement in species interactions.");
    } else {
      feedback.push("The ecosystem needs attention to achieve better stability.");
    }

    if (speciesBalance < 50) {
      feedback.push("Producer-consumer ratio is suboptimal. Consider adjusting species populations.");
    }

    if (this.metrics.environmentalStress > 70) {
      feedback.push("High environmental stress detected. Review environmental parameters.");
    }

    return feedback;
  }

  private shouldEndSimulation(): boolean {
    const timeElapsed = Date.now() - this.startTime;
    const timeLimit = this.context.timeLimit * 1000; // Convert to milliseconds
    
    return (
      timeElapsed >= timeLimit ||
      this.state.stabilityScore >= 95 ||
      this.state.species.every(s => s.energyRequirement <= 0)
    );
  }
}
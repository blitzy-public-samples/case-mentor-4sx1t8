/**
 * Human Tasks:
 * 1. Verify class-variance-authority ^0.7.0 is installed in package.json
 * 2. Ensure react ^18.0.0 is installed in package.json
 */

// react ^18.0.0
import React from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';

import { Species, SpeciesType, SimulationValidation } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import { Select } from '../shared/Select';

// Constants for species limits based on ecosystem balance rules
const PRODUCER_LIMIT = 3;
const CONSUMER_LIMIT = 5;

// Styles for consistent theming using class-variance-authority
const selectorStyles = {
  container: cn(
    'flex flex-col gap-6 p-4 rounded-lg border',
    'bg-white shadow-sm'
  ),
  section: cn(
    'flex flex-col gap-2'
  ),
  heading: cn(
    'text-lg font-semibold text-gray-900'
  ),
  validationMessage: cn(
    'text-sm',
    {
      error: 'text-red-500',
      success: 'text-green-500'
    }
  )
};

// Props interface for the SpeciesSelector component
interface SpeciesSelectorProps {
  className?: string;
}

/**
 * Component that renders the species selection interface for the ecosystem simulation
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * Requirement: Simulation Engine - Handles ecosystem game logic in the frontend
 */
export function SpeciesSelector({ className }: SpeciesSelectorProps): JSX.Element {
  const { simulationState, addSpecies, removeSpecies } = useSimulation();

  // Filter available species by type
  const getSpeciesByType = (type: SpeciesType): Species[] => {
    return simulationState?.species.filter(s => s.type === type) || [];
  };

  // Calculate remaining slots for each species type
  const producerCount = getSpeciesByType(SpeciesType.PRODUCER).length;
  const consumerCount = getSpeciesByType(SpeciesType.CONSUMER).length;
  const remainingProducers = PRODUCER_LIMIT - producerCount;
  const remainingConsumers = CONSUMER_LIMIT - consumerCount;

  // Format species data for Select component with accessibility support
  const getSpeciesOptions = (species: Species[]) => {
    return species.map(s => ({
      value: s.id,
      label: `${s.name} (Energy: ${s.energyRequirement})`,
      disabled: (s.type === SpeciesType.PRODUCER && producerCount >= PRODUCER_LIMIT) ||
                (s.type === SpeciesType.CONSUMER && consumerCount >= CONSUMER_LIMIT)
    })).sort((a, b) => a.label.localeCompare(b.label));
  };

  // Handle species selection with validation
  const handleSpeciesSelect = async (type: SpeciesType, speciesId: string) => {
    const selectedSpecies = simulationState?.species.find(s => s.id === speciesId);
    if (!selectedSpecies) return;

    try {
      // Validate species data before adding
      await SimulationValidation.speciesSchema.parseAsync(selectedSpecies);
      await addSpecies(selectedSpecies);
    } catch (error) {
      console.error('Species validation failed:', error);
    }
  };

  // Handle species removal
  const handleSpeciesRemove = (speciesId: string) => {
    removeSpecies(speciesId);
  };

  // Get validation messages for ecosystem balance
  const getValidationMessage = (type: SpeciesType) => {
    const remaining = type === SpeciesType.PRODUCER ? remainingProducers : remainingConsumers;
    const limit = type === SpeciesType.PRODUCER ? PRODUCER_LIMIT : CONSUMER_LIMIT;
    
    if (remaining === 0) {
      return {
        message: `Maximum ${limit} ${type.toLowerCase()}s selected`,
        type: 'success'
      };
    }
    return {
      message: `Select ${remaining} more ${type.toLowerCase()}${remaining > 1 ? 's' : ''}`,
      type: 'error'
    };
  };

  return (
    <div className={cn(selectorStyles.container, className)}>
      {/* Producer Species Section */}
      <section className={selectorStyles.section}>
        <h2 className={selectorStyles.heading}>Producer Species</h2>
        <Select
          value=""
          options={getSpeciesOptions(getSpeciesByType(SpeciesType.PRODUCER))}
          onChange={(value) => handleSpeciesSelect(SpeciesType.PRODUCER, value)}
          placeholder="Select producer species"
          disabled={remainingProducers === 0}
          error={remainingProducers === 0 ? undefined : getValidationMessage(SpeciesType.PRODUCER).message}
        />
        <p className={cn(
          selectorStyles.validationMessage,
          selectorStyles.validationMessage[getValidationMessage(SpeciesType.PRODUCER).type]
        )}>
          {getValidationMessage(SpeciesType.PRODUCER).message}
        </p>
      </section>

      {/* Consumer Species Section */}
      <section className={selectorStyles.section}>
        <h2 className={selectorStyles.heading}>Consumer Species</h2>
        <Select
          value=""
          options={getSpeciesOptions(getSpeciesByType(SpeciesType.CONSUMER))}
          onChange={(value) => handleSpeciesSelect(SpeciesType.CONSUMER, value)}
          placeholder="Select consumer species"
          disabled={remainingConsumers === 0}
          error={remainingConsumers === 0 ? undefined : getValidationMessage(SpeciesType.CONSUMER).message}
        />
        <p className={cn(
          selectorStyles.validationMessage,
          selectorStyles.validationMessage[getValidationMessage(SpeciesType.CONSUMER).type]
        )}>
          {getValidationMessage(SpeciesType.CONSUMER).message}
        </p>
      </section>
    </div>
  );
}
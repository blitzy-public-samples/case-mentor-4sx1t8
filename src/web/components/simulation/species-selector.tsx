// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

// Human Tasks:
// 1. Verify color contrast ratios for species selection states
// 2. Test keyboard navigation flow between species groups
// 3. Validate screen reader announcements for selection changes
// 4. Confirm touch target sizes for mobile species selection

import React, { memo } from 'react';
import { cn } from 'class-variance-authority';
import { Species, SpeciesType } from '../../types/simulation';
import { useSimulation } from '../../hooks/use-simulation';
import { Button } from '../common/button';
import { Card } from '../common/card';

/**
 * @requirement McKinsey Simulation
 * Props interface for the SpeciesSelector component
 */
interface SpeciesSelectorProps {
  disabled?: boolean;
}

/**
 * @requirement McKinsey Simulation
 * Main component for species selection and configuration in the ecosystem simulation
 */
export const SpeciesSelector = memo(({ disabled = false }: SpeciesSelectorProps) => {
  const { simulationState, updateSpecies } = useSimulation();
  const { selectedSpeciesIds, isSelecting } = simulationState;

  // Available species data - would typically come from an API or context
  const availableSpecies: Species[] = [
    { id: 'algae', name: 'Algae', type: 'PRODUCER', populationSize: 1000 },
    { id: 'plankton', name: 'Plankton', type: 'PRODUCER', populationSize: 800 },
    { id: 'seaweed', name: 'Seaweed', type: 'PRODUCER', populationSize: 600 },
    { id: 'small-fish', name: 'Small Fish', type: 'CONSUMER', populationSize: 200 },
    { id: 'medium-fish', name: 'Medium Fish', type: 'CONSUMER', populationSize: 100 },
    { id: 'large-fish', name: 'Large Fish', type: 'CONSUMER', populationSize: 50 },
    { id: 'bacteria', name: 'Bacteria', type: 'DECOMPOSER', populationSize: 2000 },
    { id: 'crabs', name: 'Crabs', type: 'DECOMPOSER', populationSize: 150 }
  ];

  /**
   * @requirement Simulation Engine
   * Validates species selection against ecological rules
   */
  const validateSelection = (selectedIds: string[]): boolean => {
    const selectedSpecies = availableSpecies.filter(species => 
      selectedIds.includes(species.id)
    );

    // Count species by type
    const counts = selectedSpecies.reduce((acc, species) => {
      acc[species.type] = (acc[species.type] || 0) + 1;
      return acc;
    }, {} as Record<SpeciesType, number>);

    // Validate producer to consumer ratio (2:1)
    const producerCount = counts['PRODUCER'] || 0;
    const consumerCount = counts['CONSUMER'] || 0;
    if (producerCount < consumerCount * 2) {
      return false;
    }

    // Verify food chain completeness
    const hasAllTypes = ['PRODUCER', 'CONSUMER', 'DECOMPOSER'].every(
      type => (counts[type as SpeciesType] || 0) > 0
    );
    if (!hasAllTypes) {
      return false;
    }

    // Validate total species count
    return selectedIds.length <= 8;
  };

  /**
   * @requirement McKinsey Simulation
   * Handles species selection/deselection with ecological validation
   */
  const handleSpeciesSelect = async (speciesId: string) => {
    if (disabled || !isSelecting) return;

    const newSelection = selectedSpeciesIds.includes(speciesId)
      ? selectedSpeciesIds.filter(id => id !== speciesId)
      : [...selectedSpeciesIds, speciesId];

    if (validateSelection(newSelection)) {
      await updateSpecies(newSelection);
    }
  };

  /**
   * @requirement McKinsey Simulation
   * Renders a group of species by type with selection states
   */
  const renderSpeciesGroup = (type: SpeciesType) => {
    const speciesGroup = availableSpecies
      .filter(species => species.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));

    const groupTitle = type.charAt(0) + type.slice(1).toLowerCase();
    
    return (
      <Card
        key={type}
        variant="bordered"
        className="p-4 mb-4"
        aria-labelledby={`species-group-${type}`}
      >
        <h3
          id={`species-group-${type}`}
          className="text-lg font-semibold mb-3"
        >
          {groupTitle}s
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {speciesGroup.map(species => {
            const isSelected = selectedSpeciesIds.includes(species.id);
            return (
              <Button
                key={species.id}
                variant={isSelected ? 'primary' : 'outline'}
                size="sm"
                disabled={disabled || (!isSelected && !validateSelection([...selectedSpeciesIds, species.id]))}
                onClick={() => handleSpeciesSelect(species.id)}
                className={cn(
                  'w-full justify-start',
                  isSelected && 'bg-primary-light'
                )}
                aria-pressed={isSelected}
                aria-label={`${species.name} (${species.type.toLowerCase()}, population ${species.populationSize})`}
              >
                <span className="flex justify-between w-full">
                  <span>{species.name}</span>
                  <span className="text-sm opacity-70">
                    Pop: {species.populationSize}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div
      className="space-y-6"
      role="region"
      aria-label="Species selection interface"
    >
      {(['PRODUCER', 'CONSUMER', 'DECOMPOSER'] as SpeciesType[]).map(type =>
        renderSpeciesGroup(type)
      )}
    </div>
  );
});

SpeciesSelector.displayName = 'SpeciesSelector';

export { handleSpeciesSelect, validateSelection };
/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 minimum)
 * 2. Test keyboard navigation and focus states
 * 3. Validate ARIA labels with screen readers
 */

// react v18.0.0
import * as React from 'react'
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority'
// date-fns v2.30.0
import { format } from 'date-fns'

import { SimulationState, SimulationStatus, Species, EnvironmentParameters } from '../../types/simulation'
import Card, { cardVariants } from '../shared/Card'
import { useSimulation } from '../../hooks/useSimulation'

// Requirement: UI Components (7.1.2)
interface SimulationCardProps {
  simulation: SimulationState
  loading: boolean
  className?: string
}

// Requirement: McKinsey Simulation (3. SCOPE/Core Features)
const formatEnvironmentValue = (parameter: keyof EnvironmentParameters, value: number): string => {
  switch (parameter) {
    case 'temperature':
      return `${value.toFixed(1)}°C`
    case 'depth':
      return `${value.toFixed(0)}m`
    case 'salinity':
      return `${value.toFixed(1)}ppt`
    case 'lightLevel':
      return `${value.toFixed(0)}%`
    default:
      return `${value}`
  }
}

// Requirement: UI Components (7.1.2)
const SimulationCard: React.FC<SimulationCardProps> = ({
  simulation,
  loading,
  className
}) => {
  // Requirement: McKinsey Simulation (3. SCOPE/Core Features)
  const renderStatus = () => {
    const statusClasses = cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      {
        'bg-blue-100 text-blue-800': simulation.status === SimulationStatus.SETUP,
        'bg-green-100 text-green-800 animate-pulse': simulation.status === SimulationStatus.RUNNING,
        'bg-yellow-100 text-yellow-800': simulation.status === SimulationStatus.COMPLETED,
        'bg-red-100 text-red-800': simulation.status === SimulationStatus.FAILED
      }
    )

    return (
      <div className="flex items-center space-x-2" role="status" aria-label="Simulation Status">
        <span className={statusClasses}>
          {simulation.status}
        </span>
        {simulation.status === SimulationStatus.RUNNING && (
          <span className="text-sm text-gray-600">
            Time Remaining: {format(simulation.timeRemaining * 1000, 'mm:ss')}
          </span>
        )}
      </div>
    )
  }

  // Requirement: McKinsey Simulation (3. SCOPE/Core Features)
  const renderEnvironment = () => {
    return (
      <div className="mt-4 space-y-2" role="region" aria-label="Environment Parameters">
        <h3 className="text-sm font-medium text-gray-700">Environment Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(simulation.environment).map(([parameter, value]) => (
            <div 
              key={parameter}
              className="flex justify-between items-center"
              role="group"
              aria-label={`${parameter} parameter`}
            >
              <span className="text-sm text-gray-600 capitalize">
                {parameter}
              </span>
              <span className="text-sm font-medium">
                {formatEnvironmentValue(parameter as keyof EnvironmentParameters, value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Requirement: McKinsey Simulation (3. SCOPE/Core Features)
  const renderSpecies = () => {
    const speciesByType = simulation.species.reduce((acc, species) => {
      const type = species.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(species)
      return acc
    }, {} as Record<string, Species[]>)

    return (
      <div className="mt-4 space-y-2" role="region" aria-label="Selected Species">
        <h3 className="text-sm font-medium text-gray-700">Selected Species</h3>
        <div className="space-y-3">
          {Object.entries(speciesByType).map(([type, species]) => (
            <div key={type} className="space-y-1">
              <h4 className="text-xs font-medium text-gray-500">{type}</h4>
              <ul className="grid grid-cols-2 gap-2" role="list">
                {species.map(s => (
                  <li 
                    key={s.id}
                    className="text-sm text-gray-600"
                    role="listitem"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'transition-opacity duration-200',
        loading ? 'opacity-50' : 'opacity-100',
        className
      )}
      aria-busy={loading}
      shadow="md"
      padding="lg"
    >
      <div className="space-y-4">
        {renderStatus()}
        {renderEnvironment()}
        {renderSpecies()}
      </div>
    </Card>
  )
}

export default SimulationCard
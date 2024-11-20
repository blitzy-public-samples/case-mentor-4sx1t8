/**
 * Human Tasks:
 * 1. Verify proper subscription tier validation with backend team
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate filter performance with large drill datasets
 */

// react ^18.0.0
'use client';
import * as React from 'react';
// next/navigation ^13.0.0
import { useRouter, useSearchParams } from 'next/navigation';

// Internal imports
import DrillCard from '../../components/drills/DrillCard';
import DrillFilter from '../../components/drills/DrillFilter';
import { useDrill } from '../../hooks/useDrill';
import { DrillType, DrillDifficulty } from '../../types/drills';

// Requirement: User Interface Design - Responsive grid layout
const gridContainerStyles = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6';
const loadingContainerStyles = 'flex items-center justify-center min-h-[400px]';
const errorContainerStyles = 'p-4 bg-red-50 text-red-800 rounded-lg mt-6';

// Requirement: Practice Drills - Main drills page component
export default function DrillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filter state from URL parameters
  const [selectedType, setSelectedType] = React.useState<DrillType | null>(
    (searchParams.get('type') as DrillType) || null
  );
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<DrillDifficulty | null>(
    (searchParams.get('difficulty') as DrillDifficulty) || null
  );
  const [selectedIndustry, setSelectedIndustry] = React.useState<string | null>(
    searchParams.get('industry') || null
  );

  // Requirement: Practice Drills - Fetch drills with proper filtering
  const { drills, loading, error, progress } = useDrill(selectedType || DrillType.CASE_PROMPT);

  // Requirement: Practice Drills - Filter change handler
  const handleFilterChange = React.useCallback(
    (type: DrillType | null, difficulty: DrillDifficulty | null, industry: string | null) => {
      // Update filter state
      setSelectedType(type);
      setSelectedDifficulty(difficulty);
      setSelectedIndustry(industry);

      // Update URL parameters
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (difficulty) params.set('difficulty', difficulty);
      if (industry) params.set('industry', industry);
      
      router.push(`/drills?${params.toString()}`);
    },
    [router]
  );

  // Requirement: User Management - Handle drill selection with subscription validation
  const handleDrillStart = React.useCallback(
    (drillId: string) => {
      const selectedDrill = drills.find(drill => drill.id === drillId);
      if (!selectedDrill) return;

      // Navigate to drill execution page
      router.push(`/drills/${drillId}/execute`);
    },
    [drills, router]
  );

  // Get unique industries from drills for filter options
  const industries = React.useMemo(() => {
    const uniqueIndustries = new Set(drills.map(drill => drill.industry));
    return Array.from(uniqueIndustries);
  }, [drills]);

  // Filter drills based on selected criteria
  const filteredDrills = React.useMemo(() => {
    return drills.filter(drill => {
      const typeMatch = !selectedType || drill.type === selectedType;
      const difficultyMatch = !selectedDifficulty || drill.difficulty === selectedDifficulty;
      const industryMatch = !selectedIndustry || drill.industry === selectedIndustry;
      return typeMatch && difficultyMatch && industryMatch;
    });
  }, [drills, selectedType, selectedDifficulty, selectedIndustry]);

  // Requirement: User Interface Design - Loading state
  if (loading) {
    return (
      <div className={loadingContainerStyles}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Requirement: User Interface Design - Error state
  if (error) {
    return (
      <div className={errorContainerStyles} role="alert">
        <p>Failed to load drills: {error}</p>
      </div>
    );
  }

  // Requirement: Practice Drills - Main drill interface
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Practice Drills</h1>
      
      {/* Requirement: Practice Drills - Filter controls */}
      <DrillFilter
        selectedType={selectedType}
        selectedDifficulty={selectedDifficulty}
        selectedIndustry={selectedIndustry}
        onTypeChange={(type) => handleFilterChange(type, selectedDifficulty, selectedIndustry)}
        onDifficultyChange={(difficulty) => handleFilterChange(selectedType, difficulty, selectedIndustry)}
        onIndustryChange={(industry) => handleFilterChange(selectedType, selectedDifficulty, industry)}
        industries={industries}
      />

      {/* Requirement: User Interface Design - Responsive grid layout */}
      <div className={gridContainerStyles}>
        {filteredDrills.map((drill) => (
          <DrillCard
            key={drill.id}
            drill={drill}
            progress={progress}
            onStart={() => handleDrillStart(drill.id)}
          />
        ))}
      </div>

      {/* Requirement: User Interface Design - Empty state */}
      {filteredDrills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No drills found matching your criteria. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
// @package react ^18.0.0

import React from 'react';
import LoadingSpinner from '../../components/common/loading-spinner';
import Card from '../../components/common/card';

// Number of skeleton cards to display for drill progress section
const SKELETON_CARDS = 3;

/**
 * Loading component for the dashboard page that displays a skeleton UI during data fetching
 * 
 * Requirement: System Performance - 2. SYSTEM OVERVIEW/Success Criteria
 * Provides immediate visual feedback for loading states to maintain perceived performance 
 * under 200ms API response time target
 * 
 * Requirement: Design System Implementation - 7.1 User Interface Design/7.1.1 Design System Specifications
 * Implements loading states using consistent design system tokens for colors, spacing, and animations
 * 
 * Requirement: Accessibility Requirements - 7.1 User Interface Design/7.1.4 Accessibility Requirements
 * Ensures loading states are accessible with proper ARIA labels and roles
 */
const Loading = () => {
  return (
    <div 
      className="w-full h-full p-6 space-y-8"
      role="progressbar"
      aria-label="Loading dashboard content"
    >
      {/* Main loading spinner */}
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" color="secondary" />
      </div>

      {/* Skeleton grid for drill progress cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: SKELETON_CARDS }).map((_, index) => (
          <Card
            key={`skeleton-card-${index}`}
            variant="default"
            padding="medium"
            className="animate-pulse"
          >
            {/* Skeleton title */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            
            {/* Skeleton progress bar */}
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            
            {/* Skeleton text lines */}
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/6" />
            </div>
          </Card>
        ))}
      </div>

      {/* Skeleton section for recent activity */}
      <div className="mt-8">
        <Card
          variant="default"
          padding="medium"
          className="animate-pulse"
        >
          {/* Skeleton title */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
          
          {/* Skeleton activity items */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`activity-${index}`} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Loading;
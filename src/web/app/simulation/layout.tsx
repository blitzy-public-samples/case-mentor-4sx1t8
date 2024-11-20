// Human Tasks:
// 1. Verify responsive layout behavior across all supported device sizes
// 2. Test navigation flow with keyboard and screen readers
// 3. Validate timer visibility and performance across different scenarios
// 4. Review layout accessibility with UX team

// @package react ^18.0.0
// @package next ^13.0.0

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Internal component imports with relative paths
import { Navbar, type NavbarProps } from '../../../components/layout/navbar';
import { Sidebar, type SidebarProps } from '../../../components/layout/sidebar';
import { SimulationTimer, type SimulationTimerProps } from '../../../components/simulation/simulation-timer';
import { useSimulation } from '../../../hooks/use-simulation';

// Layout styling constants
const LAYOUT_CLASSES = 'min-h-screen bg-gray-50';
const CONTENT_CLASSES = 'lg:pl-64 flex flex-col flex-1';
const MAIN_CLASSES = 'flex-1 py-6 px-4 sm:px-6 lg:px-8';

interface SimulationLayoutProps {
  children: React.ReactNode;
}

/**
 * @requirement McKinsey Simulation
 * Layout component that provides the shared UI structure for the simulation module
 */
const SimulationLayout: React.FC<SimulationLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentPath = usePathname();
  const { simulationState, initializeSimulation } = useSimulation();

  /**
   * @requirement User Interface Design
   * Handle mobile menu toggle with accessibility considerations
   */
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  /**
   * @requirement System Performance
   * Close mobile menu on path change for better UX
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [currentPath]);

  /**
   * @requirement McKinsey Simulation
   * Handle simulation timeout
   */
  const handleSimulationTimeout = () => {
    // Timer expiration logic will be handled by parent components
    console.warn('Simulation time expired');
  };

  return (
    <div className={LAYOUT_CLASSES}>
      {/* Main navigation header */}
      <Navbar
        showMobileMenu={isMobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      {/* Simulation navigation sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onToggle={handleMobileMenuToggle}
        className="pt-16" // Offset for navbar height
      />

      {/* Main content area */}
      <div className={CONTENT_CLASSES}>
        {/* Timer display when simulation is active */}
        {simulationState.timeRemaining.minutes > 0 && (
          <div className="fixed top-16 right-4 z-40">
            <SimulationTimer
              simulationId={currentPath.split('/').pop() || ''}
              onTimeUp={handleSimulationTimeout}
            />
          </div>
        )}

        {/* Page content */}
        <main className={MAIN_CLASSES}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SimulationLayout;
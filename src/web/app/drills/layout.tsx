// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test keyboard navigation flow with screen readers
// 3. Validate mobile menu behavior on different screen sizes
// 4. Review role-based access restrictions with product team

// @package react ^18.0.0
// @package next ^13.0.0

'use client';

import React, { useState, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { Navbar, type NavbarProps } from '../../../components/layout/navbar';
import { Sidebar, type SidebarProps } from '../../../components/layout/sidebar';
import { Breadcrumbs } from '../../../components/layout/breadcrumbs';
import { useAuth } from '../../../hooks/use-auth';

// Content area styling with responsive padding and margin
const CONTENT_CLASSES = 'flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 mt-16';

interface DrillsLayoutProps {
  children: React.ReactNode;
}

/**
 * @requirement Core Features Navigation
 * Layout component for the drills section that provides consistent navigation structure
 * and responsive layout for all drill-related pages
 */
export default function DrillsLayout({ children }: DrillsLayoutProps): JSX.Element {
  // Check authentication state
  const { authState } = useAuth();

  // Redirect to login if user is not authenticated
  if (!authState.user) {
    redirect('/auth/login');
  }

  // Mobile menu state management
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  /**
   * @requirement User Interface Design
   * Handle mobile menu toggle with memoized callback
   */
  const handleMobileMenuToggle = useCallback(() => {
    setShowMobileMenu(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 
       * @requirement User Interface Design
       * Responsive navigation bar with mobile menu controls
       */}
      <Navbar
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      {/* 
       * @requirement Core Features Navigation
       * Side navigation for drill categories with responsive behavior
       */}
      <Sidebar
        isOpen={showMobileMenu}
        onToggle={handleMobileMenuToggle}
        className="top-16"
      />

      {/* Main content area with responsive layout */}
      <main 
        className={CONTENT_CLASSES}
        role="main"
        aria-label="Drill content"
      >
        {/* 
         * @requirement User Interface Design
         * Navigation breadcrumbs for current location
         */}
        <Breadcrumbs className="mb-4" />

        {/* 
         * @requirement User Interface Design
         * Content area with ARIA landmark
         */}
        <div 
          className="bg-white rounded-lg shadow-sm p-4 md:p-6"
          role="region"
          aria-label="Drill practice area"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
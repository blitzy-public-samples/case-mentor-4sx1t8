// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test keyboard navigation flow with screen readers
// 3. Validate mobile menu behavior on different screen sizes
// 4. Review role-based navigation permissions with product team

// @package react ^18.0.0

import React, { useState } from 'react';
import { Navbar } from '../../components/layout/navbar';
import { Sidebar } from '../../components/layout/sidebar';
import { Breadcrumbs } from '../../components/layout/breadcrumbs';
import { useAuth } from '../../hooks/use-auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * @requirement User Interface Design
 * Root layout component for the dashboard section implementing design system specifications
 * with responsive behavior and semantic HTML structure
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Mobile menu state management
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { authState } = useAuth();

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  /**
   * @requirement Core Features Navigation
   * Provides navigation structure for practice drills, simulation,
   * user management and subscription features
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main navigation header */}
      <Navbar
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      {/* Side navigation */}
      <Sidebar
        isOpen={showMobileMenu}
        onToggle={handleMobileMenuToggle}
        className="pt-16" // Offset for navbar height
      />

      {/* Main content area */}
      <main 
        className={MAIN_CONTENT_CLASSES}
        role="main"
        id="main-content"
      >
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:border focus:border-primary focus:rounded-md"
        >
          Skip to main content
        </a>

        {/* Breadcrumb navigation */}
        <Breadcrumbs className="mb-4" />

        {/* Content container with responsive padding */}
        <div className={CONTENT_CONTAINER_CLASSES}>
          {/* Render authenticated content */}
          {authState.user ? (
            children
          ) : (
            <div 
              className="flex items-center justify-center min-h-[50vh]"
              role="alert"
              aria-live="polite"
            >
              <p className="text-gray-500">
                Please sign in to access the dashboard.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Layout style constants
const MAIN_CONTENT_CLASSES = 'flex-1 lg:ml-64 min-h-screen bg-gray-50';
const CONTENT_CONTAINER_CLASSES = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

export default DashboardLayout;
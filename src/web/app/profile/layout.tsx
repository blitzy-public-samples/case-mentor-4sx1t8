// Human Tasks:
// 1. Verify WCAG 2.1 AA compliance using automated testing tools
// 2. Test keyboard navigation flow with screen readers
// 3. Validate responsive behavior across all supported breakpoints
// 4. Review role-based access restrictions with product team

// @package react ^18.0.0
// @package next ^13.0.0

'use client';

import React from 'react';
import { usePathname, redirect } from 'next/navigation';
import { Navbar, type NavbarProps } from '../../components/layout/navbar';
import { Sidebar, type SidebarProps } from '../../components/layout/sidebar';
import { Breadcrumbs } from '../../components/layout/breadcrumbs';
import { useAuth } from '../../hooks/use-auth';

interface ProfileLayoutProps {
  children: React.ReactNode;
}

/**
 * @requirement Authentication Requirements
 * Server-side authentication check that protects profile routes
 */
const checkAuth = () => {
  const { authState } = useAuth();
  
  if (!authState.user || !authState.session) {
    const returnUrl = encodeURIComponent(window.location.pathname);
    redirect(`/auth/login?returnUrl=${returnUrl}`);
  }
};

/**
 * @requirement User Management
 * Profile section layout component providing structure for all profile-related pages
 */
const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const pathname = usePathname();

  // Perform authentication check
  React.useEffect(() => {
    checkAuth();
  }, [pathname]);

  /**
   * @requirement User Interface Design
   * Handle mobile menu toggle with accessibility support
   */
  const handleMobileMenuToggle = React.useCallback(() => {
    setShowMobileMenu(prev => !prev);
  }, []);

  // Props for child components
  const navbarProps: NavbarProps = {
    showMobileMenu,
    onMobileMenuToggle: handleMobileMenuToggle
  };

  const sidebarProps: SidebarProps = {
    isOpen: showMobileMenu,
    onToggle: handleMobileMenuToggle
  };

  return (
    <div className={LAYOUT_CLASSES}>
      {/* Main navigation header */}
      <Navbar {...navbarProps} />

      {/* Profile section sidebar */}
      <Sidebar {...sidebarProps} />

      {/* Main content area */}
      <main className={MAIN_CONTENT_CLASSES}>
        {/* Page content with breadcrumbs */}
        <div className={CONTENT_WRAPPER_CLASSES}>
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
};

// Layout styling constants from JSON specification
const LAYOUT_CLASSES = 'min-h-screen bg-gray-50 flex';
const MAIN_CONTENT_CLASSES = 'lg:pl-64 flex flex-col flex-1';
const CONTENT_WRAPPER_CLASSES = 'py-6 px-4 sm:px-6 lg:px-8 flex-1';

export default ProfileLayout;
// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test keyboard navigation flow with screen readers
// 3. Validate mobile menu touch targets meet minimum size requirements
// 4. Review role-based navigation permissions with product team

// @package react ^18.0.0
// @package next ^13.0.0
// @package lucide-react ^0.284.0

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { NAVIGATION_CONFIG } from '../../config/navigation';
import { Button } from '../common/button';

interface NavbarProps {
  showMobileMenu: boolean;
  onMobileMenuToggle: () => void;
}

/**
 * @requirement User Interface Design
 * Primary navigation component implementing responsive behavior and design system specifications
 */
export const Navbar: React.FC<NavbarProps> = ({
  showMobileMenu,
  onMobileMenuToggle
}) => {
  const pathname = usePathname();
  const { authState, handleLogout } = useAuth();
  
  // Base styling classes following design system specifications
  const BASE_CLASSES = 'fixed top-0 w-full bg-white border-b border-gray-200 z-50';
  const MOBILE_CLASSES = 'md:hidden flex items-center justify-between p-4';
  const DESKTOP_CLASSES = 'hidden md:flex items-center justify-between p-4 max-w-7xl mx-auto';

  /**
   * @requirement User Interface Design
   * Renders navigation items based on user role with active state styling
   */
  const renderNavItems = () => {
    const filteredItems = NAVIGATION_CONFIG.MAIN_NAV.filter(item => {
      if (!item.protected) return true;
      return item.roles.includes(authState.role);
    });

    return filteredItems.map((item) => {
      const isActive = pathname === item.path;
      const itemClasses = `
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-primary text-white' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `;

      return (
        <Link
          key={item.path}
          href={item.path}
          className={itemClasses}
          aria-current={isActive ? 'page' : undefined}
          role="menuitem"
        >
          {item.label}
        </Link>
      );
    });
  };

  /**
   * @requirement Authentication System
   * Renders authentication controls based on user state
   */
  const renderAuthSection = () => {
    if (!authState.user) {
      return (
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Sign in to your account"
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            aria-label="Create a new account"
          >
            Sign Up
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {authState.user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          aria-label="Sign out of your account"
        >
          Sign Out
        </Button>
      </div>
    );
  };

  /**
   * @requirement Accessibility Requirements
   * WCAG 2.1 AA compliant navigation with keyboard support and ARIA labels
   */
  return (
    <nav className={BASE_CLASSES} role="navigation" aria-label="Main navigation">
      {/* Mobile navigation */}
      <div className={MOBILE_CLASSES}>
        <Link href="/" className="flex items-center" aria-label="Go to homepage">
          <span className="text-xl font-bold text-primary">Case Practice</span>
        </Link>
        
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={onMobileMenuToggle}
          aria-controls="mobile-menu"
          aria-expanded={showMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        
        {showMobileMenu && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 w-full bg-white border-b border-gray-200 py-2"
            role="menu"
          >
            {renderNavItems()}
            <div className="px-4 py-2 border-t border-gray-200 mt-2">
              {renderAuthSection()}
            </div>
          </div>
        )}
      </div>

      {/* Desktop navigation */}
      <div className={DESKTOP_CLASSES}>
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center" aria-label="Go to homepage">
            <span className="text-xl font-bold text-primary">Case Practice</span>
          </Link>
          <div className="flex items-center gap-4" role="menubar">
            {renderNavItems()}
          </div>
        </div>
        {renderAuthSection()}
      </div>
    </nav>
  );
};
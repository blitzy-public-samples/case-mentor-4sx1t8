// Human Tasks:
// 1. Verify WCAG 2.1 AA compliance using accessibility testing tools
// 2. Test keyboard navigation flow in all supported browsers
// 3. Validate mobile menu behavior on different screen sizes
// 4. Confirm role-based menu visibility with different user types

// @package react ^18.0.0
// @package next/link ^13.0.0
// @package classnames ^2.3.0
// @package lucide-react ^0.284.0

import React from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { Menu } from 'lucide-react';
import { SIDE_NAV } from '../../config/navigation';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../common/button';

// Base styling classes for the sidebar component
const BASE_CLASSES = 'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out';
const MOBILE_CLASSES = 'transform -translate-x-full lg:translate-x-0';
const DESKTOP_CLASSES = 'hidden lg:block';
const NAV_ITEM_CLASSES = 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors';
const NAV_GROUP_CLASSES = 'px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * @requirement Core Features Navigation
 * A responsive sidebar component that provides navigation for the Case Interview Practice Platform
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  className
}) => {
  const { authState } = useAuth();

  /**
   * @requirement Core Features Navigation
   * Renders a single navigation item with role-based visibility
   */
  const renderNavItem = React.useCallback((item: NavigationItem, index: number) => {
    // Skip rendering if user doesn't have access
    if (item.protected && !item.roles.includes(authState.role)) {
      return null;
    }

    const itemClasses = cn(NAV_ITEM_CLASSES, {
      'bg-gray-50': window.location.pathname === item.path
    });

    return (
      <li key={`nav-item-${index}`}>
        <Link
          href={item.path}
          className={itemClasses}
          aria-current={window.location.pathname === item.path ? 'page' : undefined}
        >
          <item.icon className="w-5 h-5 mr-3 text-gray-500" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
        {item.children && (
          <ul className="pl-8 mt-1 space-y-1">
            {item.children.map((child, childIndex) => 
              renderNavItem(child, `${index}-${childIndex}`)
            )}
          </ul>
        )}
      </li>
    );
  }, [authState.role]);

  /**
   * @requirement User Interface Design
   * Renders a group of navigation items with semantic HTML structure
   */
  const renderNavGroup = React.useCallback((group: NavigationGroup, index: number) => {
    return (
      <div key={`nav-group-${index}`} role="navigation" aria-label={group.label}>
        <h2 className={NAV_GROUP_CLASSES}>{group.label}</h2>
        <ul className="mt-2 space-y-1">
          {group.items.map((item, itemIndex) => renderNavItem(item, itemIndex))}
        </ul>
      </div>
    );
  }, [renderNavItem]);

  /**
   * @requirement User Interface Design
   * Combines classes for responsive sidebar layout
   */
  const sidebarClasses = cn(
    BASE_CLASSES,
    {
      [MOBILE_CLASSES]: !isOpen,
      [DESKTOP_CLASSES]: !isOpen
    },
    className
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="fixed top-4 left-4 z-50"
          ariaLabel={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Sidebar navigation */}
      <aside
        className={sidebarClasses}
        aria-label="Main navigation"
        role="navigation"
      >
        <nav className="h-full overflow-y-auto py-6 px-3">
          <div className="space-y-8">
            {SIDE_NAV.map((group, index) => renderNavGroup(group, index))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export type { SidebarProps };
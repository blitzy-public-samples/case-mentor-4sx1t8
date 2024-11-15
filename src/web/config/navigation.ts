// Human Tasks:
// 1. Verify icon imports match the installed Lucide React version
// 2. Confirm navigation paths align with deployed application routes
// 3. Review role-based access permissions match business requirements
// 4. Set up navigation analytics tracking in production environment

import { IconType } from 'lucide-react'; // v0.284.0
import { ROUTES } from './routes';
import { AuthRole } from '../types/auth';

/**
 * @requirement User Interface Design
 * Interface defining a navigation menu item with role-based access control
 */
export interface NavigationItem {
  label: string;
  path: string;
  icon: IconType;
  protected: boolean;
  roles: AuthRole[];
  children?: NavigationItem[];
}

/**
 * @requirement User Interface Design
 * Interface defining a group of navigation items for sidebar organization
 */
export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

/**
 * @requirement Core Features Navigation
 * Main navigation configuration for the application header
 */
export const NAVIGATION_CONFIG = {
  MAIN_NAV: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      protected: true,
      roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
    },
    {
      label: 'Practice Drills',
      path: ROUTES.DRILLS.baseUrl,
      icon: 'Target',
      protected: true,
      roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
    },
    {
      label: 'McKinsey Simulation',
      path: ROUTES.SIMULATION.baseUrl,
      icon: 'Activity',
      protected: true,
      roles: [AuthRole.PAID_USER]
    }
  ],
  SIDE_NAV: [
    {
      label: 'Account',
      items: [
        {
          label: 'Profile',
          path: ROUTES.PROFILE.routes.OVERVIEW.path,
          icon: 'User',
          protected: true,
          roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
        },
        {
          label: 'Settings',
          path: ROUTES.PROFILE.routes.SETTINGS.path,
          icon: 'Settings',
          protected: true,
          roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
        },
        {
          label: 'Subscription',
          path: ROUTES.PROFILE.routes.SUBSCRIPTION.path,
          icon: 'CreditCard',
          protected: true,
          roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
        }
      ]
    },
    {
      label: 'Progress',
      items: [
        {
          label: 'Performance',
          path: ROUTES.PROFILE.routes.PROGRESS.path,
          icon: 'LineChart',
          protected: true,
          roles: [AuthRole.FREE_USER, AuthRole.PAID_USER]
        }
      ]
    }
  ]
} as const;

/**
 * @requirement Core Features Navigation
 * Checks if a navigation item is accessible to the current user role
 */
export function isAccessible(item: NavigationItem, currentRole: AuthRole): boolean {
  if (!item.protected) {
    return true;
  }
  return item.roles.includes(currentRole);
}

/**
 * @requirement Core Features Navigation
 * Filters navigation items based on user role
 */
export function filterNavigationByRole(
  items: NavigationItem[],
  role: AuthRole
): NavigationItem[] {
  return items.filter(item => {
    const accessible = isAccessible(item, role);
    if (!accessible) {
      return false;
    }

    if (item.children && item.children.length > 0) {
      const filteredChildren = filterNavigationByRole(item.children, role);
      return filteredChildren.length > 0;
    }

    return true;
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: filterNavigationByRole(item.children, role)
      };
    }
    return item;
  });
}
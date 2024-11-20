// Import required types
import { AuthState } from '../types/auth';
import { APIResponse } from '../types/api';

// Human Tasks:
// 1. Ensure all route components are properly implemented and exported
// 2. Configure route-based analytics tracking
// 3. Set up proper error boundaries for each route
// 4. Implement route-based code splitting strategy

// Requirement: Core Features - Route definitions for practice drills, McKinsey simulation, user management
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/verify'
] as const;

// Requirement: Core Features - Protected routes requiring authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/drills',
  '/simulation',
  '/profile',
  '/progress',
  '/settings',
  '/subscription'
] as const;

// Routes that should redirect to dashboard when user is authenticated
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify'
] as const;

// Requirement: Authentication & Authorization - Route-based access control
export const isProtectedRoute = (path: string): boolean => {
  // Check if path starts with dashboard prefix
  if (path.startsWith('/dashboard')) {
    return true;
  }

  // Check if path exists in protected routes
  return PROTECTED_ROUTES.includes(path as typeof PROTECTED_ROUTES[number]);
};

// Requirement: Authentication & Authorization - Route redirection logic
export const getRedirectPath = (
  authState: AuthState,
  currentPath: string
): string | null => {
  // Check if current route requires authentication
  const requiresAuth = isProtectedRoute(currentPath);

  // Redirect to login if protected route accessed without authentication
  if (requiresAuth && !authState.authenticated) {
    return '/login';
  }

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.includes(currentPath as typeof AUTH_ROUTES[number]);

  // Redirect authenticated users away from auth routes to dashboard
  if (isAuthRoute && authState.authenticated) {
    return '/dashboard';
  }

  // No redirect needed
  return null;
};

// Requirement: Core Features - Route configuration with access control settings
export const routes = {
  // Public routes accessible without authentication
  public: [
    {
      path: '/',
      exact: true,
      auth: false
    },
    {
      path: '/login',
      exact: true,
      auth: false
    },
    {
      path: '/register',
      exact: true,
      auth: false
    },
    {
      path: '/reset-password',
      exact: true,
      auth: false
    },
    {
      path: '/verify',
      exact: true,
      auth: false
    }
  ],

  // Authentication required routes
  auth: [
    {
      path: '/profile',
      exact: true,
      auth: true
    },
    {
      path: '/settings',
      exact: true,
      auth: true
    },
    {
      path: '/subscription',
      exact: true,
      auth: true
    }
  ],

  // Dashboard and feature routes requiring authentication
  dashboard: [
    {
      path: '/dashboard',
      exact: true,
      auth: true
    },
    {
      path: '/drills',
      exact: false, // Allow nested routes
      auth: true
    },
    {
      path: '/simulation',
      exact: false, // Allow nested routes
      auth: true
    },
    {
      path: '/progress',
      exact: true,
      auth: true
    }
  ]
} as const;
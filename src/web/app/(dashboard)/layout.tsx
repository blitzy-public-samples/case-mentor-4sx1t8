/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - next/navigation ^13.0.0
 * 2. Test layout responsiveness across all breakpoints
 * 3. Verify WCAG 2.1 AA compliance with screen reader testing
 */

// External dependencies
import * as React from 'react' // ^18.0.0
import { redirect } from 'next/navigation' // ^13.0.0

// Internal dependencies
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { AuthProvider } from '../../providers/AuthProvider'
import { ProgressProvider } from '../../providers/ProgressProvider'

// Define metadata for dashboard section
export const metadata = {
  title: 'Case Interview Practice Platform - Dashboard',
  description: 'Practice and improve your consulting case interview skills'
}

// Props interface for the layout component
interface LayoutProps {
  children: React.ReactNode
}

/**
 * Root layout component for the dashboard section that provides authentication
 * protection and consistent layout structure for all dashboard routes
 * 
 * Requirement: User Interface Design (6.2.1 Main Navigation)
 * - Implements main dashboard layout structure with responsive navigation
 * 
 * Requirement: Authentication & Authorization (8.1 Authentication and Authorization)
 * - Protects dashboard routes with JWT-based authentication
 * 
 * Requirement: User Management (3. SCOPE/Core Features/User Management)
 * - Integrates progress tracking with automatic data revalidation
 */
export default function RootLayout({ children }: LayoutProps) {
  // Requirement: Authentication & Authorization (8.1)
  // Wrap content with AuthProvider for JWT-based authentication
  return (
    <AuthProvider>
      {({ state }) => {
        // Redirect unauthenticated users to login
        if (!state.initialized) {
          return null // Show nothing while checking auth
        }

        if (!state.authenticated) {
          redirect('/login')
        }

        // Requirement: User Management (3. SCOPE/Core Features)
        // Wrap authenticated content with ProgressProvider for tracking
        return (
          <ProgressProvider>
            {/* 
              Requirement: User Interface Design (6.2.1)
              Render DashboardLayout with responsive structure and WCAG compliance
            */}
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </ProgressProvider>
        )
      }}
    </AuthProvider>
  )
}
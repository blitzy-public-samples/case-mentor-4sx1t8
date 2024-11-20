/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - next/navigation ^13.0.0
 *    - class-variance-authority ^0.7.0
 * 2. Test responsive layout across all breakpoints
 * 3. Verify ARIA landmarks with screen reader testing
 */

// External dependencies
import * as React from 'react' // ^18.0.0
import { usePathname } from 'next/navigation' // ^13.0.0
import { cn } from 'class-variance-authority' // ^0.7.0

// Internal dependencies
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../hooks/useAuth'

// Layout breakpoints and dimensions
const LAYOUT_BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1440px'
}

const SIDEBAR_WIDTH = {
  COLLAPSED: '64px',
  EXPANDED: '256px'
}

const LAYOUT_Z_INDEX = {
  HEADER: '50',
  SIDEBAR: '40',
  CONTENT: '0'
}

// Props interface for the DashboardLayout component
interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Main dashboard layout component that provides consistent structure and responsive behavior
 * Requirement: User Interface Design (6.2.1 Main Navigation)
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state: authState } = useAuth()
  const pathname = usePathname()
  const [isMobileView, setIsMobileView] = React.useState(false)

  // Handle responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < parseInt(LAYOUT_BREAKPOINTS.MOBILE))
    }

    // Initial check
    handleResize()

    // Requirement: Responsive Behavior (6.3 Responsive Behavior)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Requirement: User Interface Design (6.2.1 Main Navigation)
  // Main layout container with responsive grid
  const containerStyles = cn(
    'min-h-screen bg-gray-50 dark:bg-gray-900',
    'transition-all duration-200 ease-in-out'
  )

  // Content area styles with proper spacing and overflow handling
  const contentStyles = cn(
    'flex-1 px-4 py-8 md:px-6 lg:px-8',
    'transition-all duration-200 ease-in-out',
    'overflow-y-auto',
    {
      'ml-[64px] md:ml-[256px]': !isMobileView, // Adjust margin based on sidebar width
      'ml-0': isMobileView
    }
  )

  // Requirement: Accessibility Requirements (7.1.4 Accessibility Requirements)
  // Main layout structure with proper ARIA landmarks
  return (
    <div className={containerStyles}>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:p-4 focus:bg-white focus:text-primary"
      >
        Skip to main content
      </a>

      {/* Header component with authentication controls */}
      <Header 
        className={cn(
          'fixed top-0 right-0 left-0',
          'z-[50]',
          {
            'left-[64px] md:left-[256px]': !isMobileView,
            'left-0': isMobileView
          }
        )}
      />

      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <main
        id="main-content"
        className={contentStyles}
        role="main"
        aria-label="Dashboard content"
      >
        {/* Requirement: Accessibility Requirements (7.1.4) */}
        {/* Ensure content is only rendered for authenticated users */}
        {authState.authenticated ? (
          children
        ) : (
          <div
            role="alert"
            className="flex items-center justify-center h-full"
          >
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to access this content
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
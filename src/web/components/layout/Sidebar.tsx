/**
 * Human Tasks:
 * 1. Verify that tailwind.config.js includes the required color and spacing configurations
 * 2. Test keyboard navigation with screen readers
 * 3. Verify color contrast ratios meet WCAG 2.1 AA standards
 */

// react ^18.0.0
import * as React from 'react'
// next/navigation ^13.0.0
import { usePathname } from 'next/navigation'
// next/link ^13.0.0
import Link from 'next/link'
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority'

// Internal imports
import { buttonVariants } from '../shared/Button'
import { useAuth } from '../../hooks/useAuth'
import { routes } from '../../config/routes'

// Requirement: Core Features Navigation
// Constants for responsive behavior
const MOBILE_BREAKPOINT = 768

// Requirement: User Interface Design
// Main sidebar navigation component
export const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const { state, logout } = useAuth()

  // Requirement: Accessibility Requirements
  // Handle keyboard navigation for mobile menu toggle
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMobileMenuOpen(!isMobileMenuOpen)
    }
  }

  // Requirement: Core Features Navigation
  // Handle responsive menu visibility
  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 transform bg-white transition-transform duration-200 ease-in-out',
        'border-r border-gray-200 shadow-sm',
        {
          '-translate-x-full': !isMobileMenuOpen && window.innerWidth < MOBILE_BREAKPOINT,
          'translate-x-0': isMobileMenuOpen || window.innerWidth >= MOBILE_BREAKPOINT
        }
      )}
      aria-label="Main navigation"
    >
      {/* Requirement: User Interface Design */}
      {/* Logo and branding section */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link 
          href="/dashboard"
          className="flex items-center space-x-2 text-xl font-semibold"
          aria-label="Case Practice Platform Dashboard"
        >
          <span className="text-primary">Case Practice</span>
        </Link>
        
        {/* Mobile menu button */}
        <button
          type="button"
          className="block md:hidden"
          onClick={handleMenuToggle}
          onKeyDown={handleMenuKeyDown}
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-menu"
          aria-label="Toggle navigation menu"
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Requirement: Core Features Navigation */}
      {/* Main navigation menu */}
      <nav
        id="sidebar-menu"
        className="flex h-[calc(100vh-4rem)] flex-col justify-between p-4"
        role="navigation"
      >
        <div className="space-y-1">
          {routes.dashboard.map((route) => (
            <NavItem
              key={route.path}
              href={route.path}
              label={route.path.slice(1).charAt(0).toUpperCase() + route.path.slice(2)}
              icon={getRouteIcon(route.path)}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
        </div>

        {/* User profile and authentication section */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          {state.user && (
            <div className="mb-4 px-2 text-sm text-gray-600">
              <p className="font-medium">{state.user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start'
            )}
            aria-label="Sign out"
          >
            <LogoutIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  )
}

// Requirement: Accessibility Requirements
// Individual navigation item component with accessibility support
const NavItem = ({
  href,
  icon,
  label,
  onClick
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'w-full justify-start',
        isActive && 'bg-gray-100 text-primary',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="mr-2" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  )
}

// Route-specific icons
const getRouteIcon = (path: string): React.ReactNode => {
  switch (path) {
    case '/dashboard':
      return <DashboardIcon className="h-4 w-4" />
    case '/drills':
      return <DrillsIcon className="h-4 w-4" />
    case '/simulation':
      return <SimulationIcon className="h-4 w-4" />
    case '/progress':
      return <ProgressIcon className="h-4 w-4" />
    default:
      return <DefaultIcon className="h-4 w-4" />
  }
}

// Icon components
const DashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const DrillsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const SimulationIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const ProgressIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
)

const DefaultIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
)

const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
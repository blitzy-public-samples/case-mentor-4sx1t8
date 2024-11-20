/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - next ^13.0.0
 *    - next/image ^13.0.0
 *    - next/link ^13.0.0
 * 2. Ensure theme configuration is properly set up for dark mode support
 * 3. Test responsive layout across all breakpoints
 * 4. Verify ARIA labels with screen reader testing
 */

// External dependencies
import React from 'react' // ^18.0.0
import Link from 'next/link' // ^13.0.0
import Image from 'next/image' // ^13.0.0

// Internal dependencies
import { Button } from '../shared/Button'
import { Avatar } from '../shared/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

// Navigation items with auth requirements
const NAVIGATION_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { label: 'Drills', href: '/drills', requiresAuth: true },
  { label: 'Simulation', href: '/simulation', requiresAuth: true }
]

interface HeaderProps {
  className?: string
}

// Requirement: Navigation Design (6.2.1 Main Navigation)
// Main header component implementing navigation, auth controls, and theme switching
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { state: authState, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Requirement: Design System Implementation (7.1.1)
  // Container styles using design system tokens
  const containerStyles = `
    w-full
    h-16
    px-4
    md:px-6
    flex
    items-center
    justify-between
    fixed
    top-0
    z-50
    bg-white
    dark:bg-gray-900
    border-b
    border-gray-200
    dark:border-gray-800
    ${className}
  `

  // Requirement: Navigation Design (6.2.1)
  // Logo and brand section
  const renderLogo = () => (
    <Link 
      href="/"
      className="flex items-center space-x-2"
      aria-label="Case Practice Platform Home"
    >
      <Image
        src="/logo.svg"
        alt="Platform Logo"
        width={32}
        height={32}
        priority
      />
      <span className="hidden md:inline-block font-semibold text-lg">
        Case Practice Platform
      </span>
    </Link>
  )

  // Requirement: Navigation Design (6.2.1)
  // Main navigation links
  const renderNavigation = () => (
    <nav className="hidden md:flex items-center space-x-4">
      {NAVIGATION_ITEMS.map(item => {
        if (item.requiresAuth && !authState.authenticated) return null
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            aria-current={location.pathname === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  // Requirement: Design System Implementation (7.1.1)
  // Theme toggle and user controls
  const renderControls = () => (
    <div className="flex items-center space-x-4">
      {/* Requirement: Accessibility Requirements (7.1.4) */}
      {/* Theme toggle with ARIA support */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>

      {authState.authenticated ? (
        <div className="flex items-center space-x-4">
          {/* Requirement: Navigation Design (6.2.1) */}
          {/* User profile section */}
          <Avatar
            size="sm"
            profile={authState.session!.profile}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            aria-label="Sign out"
          >
            Sign out
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button
            variant="primary"
            size="sm"
            asChild
          >
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      )}
    </div>
  )

  // Requirement: Accessibility Requirements (7.1.4)
  // Main header with proper ARIA landmarks
  return (
    <header 
      className={containerStyles}
      role="banner"
    >
      {renderLogo()}
      {renderNavigation()}
      {renderControls()}
    </header>
  )
}
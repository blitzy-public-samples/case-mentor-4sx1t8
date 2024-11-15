// react v18.0.0
import React, { createContext, useContext, ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { theme } from '../config/theme'

/**
 * Human Tasks:
 * 1. Verify that ThemeProvider is wrapped around the root application component
 * 2. Ensure CSS variables are properly configured in the global stylesheet
 * 3. Test theme switching behavior across different components
 */

// Type definition for theme context values
type ThemeContextType = {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

// Create theme context with type safety
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Custom hook to access theme context values with type safety
 * 
 * @throws {Error} When used outside of ThemeProvider
 * @returns {ThemeContextType} Theme context value object
 */
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * React component that provides theme context to the application
 * with system preference sync and persistence
 * 
 * Requirement: Design System Specifications (7.1.1)
 * Implements theme management according to the design system specifications
 * including color schemes and accessibility requirements
 * 
 * Requirement: Accessibility Requirements (7.1.4)
 * Ensures WCAG 2.1 AA compliant theming with proper color contrast ratios
 * through validated theme tokens
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme state with system preference detection
  const { theme: currentTheme, toggleTheme, setTheme } = useTheme()

  // Create context value object with theme state and control functions
  const contextValue: ThemeContextType = {
    theme: currentTheme,
    toggleTheme,
    setTheme
  }

  // Apply theme-specific styles when theme changes
  React.useEffect(() => {
    // Apply theme colors from the design system
    Object.entries(theme.colors).forEach(([colorKey, colorValues]) => {
      Object.entries(colorValues).forEach(([variant, value]) => {
        document.documentElement.style.setProperty(
          `--${colorKey}-${variant}`,
          value
        )
      })
    })

    // Set theme class on root element for CSS variable switching
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(currentTheme)
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
// react v18.0.0
import { useState, useEffect, useCallback } from 'react'
import { colors } from '../config/theme'

/**
 * Human Tasks:
 * 1. Verify that localStorage is available in your runtime environment
 * 2. Test theme switching behavior across different browsers and devices
 * 3. Validate that CSS variables are properly applied when theme changes
 */

// Global constants for theme management
const STORAGE_KEY = 'theme-preference'
const THEME_VALUES = ['light', 'dark'] as const
type Theme = typeof THEME_VALUES[number]

/**
 * Detects system color scheme preference using media query
 * @returns {'light' | 'dark'} The system's preferred color scheme
 */
const getSystemTheme = (): Theme => {
  // Check if window.matchMedia is available in runtime environment
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light'
  }

  // Query prefers-color-scheme media feature
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Custom hook for managing theme state with system preference sync and persistence
 * 
 * Requirement: Design System Specifications (7.1.1)
 * Implements theme management according to the design system specifications
 * 
 * Requirement: Accessibility Requirements (7.1.4)
 * Ensures WCAG 2.1 AA compliant theming by utilizing validated theme tokens
 */
export const useTheme = () => {
  // Initialize theme state from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    if (storedTheme && THEME_VALUES.includes(storedTheme as Theme)) {
      return storedTheme as Theme
    }
    
    return getSystemTheme()
  })

  // Memoized theme toggle function
  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }, [])

  // Memoized theme setter function
  const setTheme = useCallback((newTheme: Theme) => {
    if (THEME_VALUES.includes(newTheme)) {
      setThemeState(newTheme)
    }
  }, [])

  useEffect(() => {
    // Set up system preference change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setThemeState(event.matches ? 'dark' : 'light')
      }
    }

    // Add event listener with modern API support check
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery?.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
    }

    // Cleanup function
    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  }, [])

  useEffect(() => {
    // Update document root class for CSS variable switching
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)

      // Apply theme-specific color tokens from the design system
      Object.entries(colors).forEach(([colorKey, colorValues]) => {
        Object.entries(colorValues).forEach(([variant, value]) => {
          document.documentElement.style.setProperty(
            `--color-${colorKey}-${variant}`,
            value
          )
        })
      })
    }

    // Persist theme preference to localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme)
    }
  }, [theme])

  return {
    theme,
    toggleTheme,
    setTheme
  } as const
}
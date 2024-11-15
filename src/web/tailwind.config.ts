// @ts-check
import type { Config } from 'tailwindcss' // v3.3.0
import typography from '@tailwindcss/typography' // v0.5.10
import forms from '@tailwindcss/forms' // v0.5.7
import { theme } from '../config/theme'

/**
 * Human Tasks:
 * 1. Verify @tailwindcss/typography and @tailwindcss/forms plugins are installed
 * 2. Ensure all content paths are correctly configured for your project structure
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards in both light and dark modes
 */

// Requirement: Design System Specifications (7.1.1)
// Creates screen breakpoint configuration for responsive design
const createScreenConfig = (breakpoints: Record<string, string>) => {
  return Object.entries(breakpoints).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: `min-width: ${value}`
  }), {})
}

// Requirement: Design System Specifications (7.1.1)
// Implements core design system configuration
const config: Config = {
  // Scan all TypeScript and React components for classes
  content: [
    './**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  
  // Enable dark mode with class strategy
  darkMode: 'class',
  
  theme: {
    // Requirement: Design System Specifications (7.1.1)
    // Extend default theme with design system tokens
    extend: {
      colors: theme.colors,
      fontFamily: theme.fontFamily,
      spacing: theme.spacing,
      screens: createScreenConfig(theme.breakpoints),
      boxShadow: theme.shadows,
      
      // Requirement: Component Library (7.1.2)
      // Configure typography scale for content
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: theme.colors.primary.base,
            p: {
              color: theme.colors.primary.base
            },
            a: {
              color: theme.colors.secondary.base,
              '&:hover': {
                color: theme.colors.secondary.hover
              }
            },
            strong: {
              color: theme.colors.primary.base
            }
          }
        }
      }
    }
  },
  
  // Requirement: Component Library (7.1.2)
  // Configure plugins for enhanced styling capabilities
  plugins: [
    typography(),
    forms({
      strategy: 'class' // Opt-in form styling
    })
  ]
}

export default config
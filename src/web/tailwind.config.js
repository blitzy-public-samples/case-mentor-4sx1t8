// @package tailwindcss ^3.0.0
// @package tailwindcss-animate ^1.0.0
// @package @tailwindcss/forms ^0.5.0
// @package @tailwindcss/typography ^0.5.0

// Human Tasks:
// 1. Verify all content paths are correctly configured for the project structure
// 2. Test shadcn/ui component styling integration
// 3. Validate color contrast ratios meet WCAG 2.1 AA standards
// 4. Check responsive design breakpoints across different devices

const { typography, colors, spacing, breakpoints, shadows } = require('./config/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Requirement: Component Library Integration - Content paths for utility scanning
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],

  // Requirement: Design System Implementation - Theme customization
  theme: {
    // Container defaults
    container: {
      center: true,
      padding: spacing[4],
      screens: {
        mobile: breakpoints.mobile,
        tablet: breakpoints.tablet,
        desktop: breakpoints.desktop,
        wide: breakpoints.wide,
      },
    },

    // Font families
    fontFamily: {
      sans: [typography.fontFamily.primary, ...typography.fontFamily.system.split(', ')],
      mono: [typography.fontFamily.secondary, 'monospace'],
    },

    // Font sizes with line heights
    fontSize: {
      xs: [typography.fontSize.xs, typography.lineHeight.normal],
      sm: [typography.fontSize.sm, typography.lineHeight.normal],
      base: [typography.fontSize.base, typography.lineHeight.normal],
      lg: [typography.fontSize.lg, typography.lineHeight.normal],
      xl: [typography.fontSize.xl, typography.lineHeight.tight],
      '2xl': [typography.fontSize['2xl'], typography.lineHeight.tight],
      '3xl': [typography.fontSize['3xl'], typography.lineHeight.tight],
    },

    // Font weights
    fontWeight: {
      normal: typography.fontWeight.normal,
      medium: typography.fontWeight.medium,
      semibold: typography.fontWeight.semibold,
      bold: typography.fontWeight.bold,
    },

    // Requirement: Accessibility Standards - WCAG 2.1 AA compliant colors
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      error: colors.error,
      warning: colors.warning,
      gray: colors.gray,
    },

    // Spacing scale
    spacing: spacing,

    // Breakpoints
    screens: {
      mobile: breakpoints.mobile,
      tablet: breakpoints.tablet,
      desktop: breakpoints.desktop,
      wide: breakpoints.wide,
    },

    // Box shadows
    boxShadow: {
      sm: shadows.sm,
      md: shadows.md,
      lg: shadows.lg,
      none: 'none',
    },

    // Animation durations
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
    },

    // Animation timing functions
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },

  // Requirement: Component Library Integration - Required plugins
  plugins: [
    require('tailwindcss-animate'), // Animation utilities for shadcn/ui
    require('@tailwindcss/forms'), // Form styling
    require('@tailwindcss/typography'), // Prose styling
  ],
};
/**
 * Human Tasks:
 * 1. Verify postcss, tailwindcss, and autoprefixer packages are installed at specified versions
 * 2. Ensure Node environment is configured to handle PostCSS processing
 * 3. Validate PostCSS integration with build pipeline
 */

// External dependencies
// tailwindcss v3.3.0
// autoprefixer v10.4.14
// postcss v8.4.24

// Requirement: Design System Implementation (7.1.1 Design System Specifications)
// Import Tailwind configuration to ensure consistent design system implementation
const config = require('./tailwind.config.ts')

// Requirement: Performance Optimization (2. SYSTEM OVERVIEW/Success Criteria)
// Configure optimized PostCSS plugin chain for <200ms API response time target
module.exports = {
  plugins: [
    // Core Tailwind CSS processing with imported configuration
    // Inherits theme, content and plugin settings from tailwind.config.ts
    require('tailwindcss')(config),
    
    // Cross-browser compatibility through vendor prefixing
    // Enable flexbox and grid prefixing for maximum compatibility
    require('autoprefixer')({
      flexbox: true,
      grid: true
    })
  ]
}
// Human Tasks:
// 1. Verify that the Button component is properly exported from the shared components
// 2. Ensure the design system tokens are properly configured in tailwind.config.js
// 3. Test page with screen readers to verify accessibility compliance
// 4. Validate color contrast ratios meet WCAG 2.1 AA standards

// next/link ^13.0.0
import Link from 'next/link'
import { Button } from '../components/shared/Button'

// Requirement: User Interface Design (7.1)
// Implements consistent design system components for error pages
export default function NotFound() {
  // Requirement: Accessibility Requirements (7.1.4)
  // Ensures error page meets WCAG 2.1 AA compliance with proper heading structure
  return (
    <main
      role="main"
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center"
    >
      {/* Proper heading structure for screen readers */}
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
        404 - Page Not Found
      </h1>

      {/* Descriptive error message with sufficient color contrast */}
      <p className="mb-8 max-w-md text-lg text-gray-600">
        We couldn&apos;t find the page you&apos;re looking for. Please check the URL or return to the dashboard.
      </p>

      {/* Accessible navigation with keyboard support */}
      <Link href="/dashboard" className="inline-block">
        <Button
          variant="primary"
          size="md"
          aria-label="Return to dashboard"
        >
          Return to Dashboard
        </Button>
      </Link>
    </main>
  )
}
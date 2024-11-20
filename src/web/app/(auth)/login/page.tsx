// react v18.0.0
'use client'
import React from 'react'
// next v13.0.0
import { Metadata } from 'next'

// Internal imports
import { LoginForm } from '../../components/auth/LoginForm'
import Card from '../../components/shared/Card'

// Requirement: User Interface Design - WCAG 2.1 AA compliant login page
// Export static metadata for SEO optimization
export const metadata: Metadata = {
  title: 'Login | Case Interview Practice Platform',
  description: 'Securely access your case interview practice account with email and password authentication.',
  robots: {
    index: true,
    follow: true,
  },
}

// Requirement: Authentication Flow - Main login page component
const LoginPage = () => {
  return (
    // Main container with semantic HTML and ARIA landmarks
    <main 
      className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="login-heading"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Accessible heading for screen readers */}
        <h1 
          id="login-heading" 
          className="text-3xl font-bold text-center text-gray-900"
          tabIndex={-1} // Allow programmatic focus without keyboard focus
        >
          Sign in to your account
        </h1>

        {/* Card component with consistent styling */}
        <Card
          padding="lg"
          shadow="md"
          className="bg-white"
          aria-label="Login form container"
        >
          {/* Requirement: Authentication Flow - Login form with Supabase integration */}
          <LoginForm />
        </Card>

        {/* Additional help text for screen readers */}
        <p 
          className="mt-2 text-center text-sm text-gray-600"
          aria-live="polite" // Announce dynamic content changes
        >
          Need help? Contact support for assistance.
        </p>
      </div>
    </main>
  )
}

export default LoginPage
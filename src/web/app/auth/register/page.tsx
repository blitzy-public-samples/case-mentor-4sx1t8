// next.js version: ^13.0.0
// react version: ^18.0.0

'use client';

import { redirect } from 'next/navigation';
import { RegisterForm } from '../../../components/auth/register-form';
import { useAuth } from '../../../hooks/use-auth';

/**
 * Human Tasks:
 * 1. Configure SEO metadata in production environment
 * 2. Set up analytics tracking for registration page
 * 3. Configure redirect URLs based on environment
 */

/**
 * @requirement Authentication System
 * Next.js page component for user registration with authentication state handling
 */
export default function RegisterPage() {
  const { authState } = useAuth();

  // Redirect authenticated users to dashboard
  if (authState.user && !authState.loading) {
    redirect('/dashboard');
  }

  /**
   * @requirement User Management
   * Handle successful registration by redirecting to dashboard
   */
  const handleRegistrationSuccess = () => {
    redirect('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create your account
        </h1>
        <p className="text-gray-600">
          Start practicing case interviews with AI-powered feedback
        </p>
      </div>

      <RegisterForm onSuccess={handleRegistrationSuccess} />

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="/auth/login"
          className="font-medium text-primary hover:text-primary-dark"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

/**
 * @requirement Authentication System
 * Static metadata for SEO optimization of registration page
 */
export const metadata = {
  title: 'Register - Case Interview Practice Platform',
  description: 'Create your account to start practicing case interviews with AI-powered feedback',
};
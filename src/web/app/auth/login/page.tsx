/**
 * Human Tasks:
 * 1. Configure Supabase authentication settings in dashboard
 * 2. Set up redirect URLs in authentication providers
 * 3. Test login flow with various email providers
 * 4. Verify WCAG 2.1 AA compliance with automated tools
 */

// next version: ^13.0.0
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '../../../components/auth/login-form';
import { useAuth } from '../../../hooks/use-auth';

/**
 * @requirement Authentication System
 * Static metadata configuration for the login page
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Login - Case Interview Practice Platform',
    description: 'Login to access your case interview practice dashboard',
    openGraph: {
      title: 'Login - Case Interview Practice Platform',
      description: 'Access your personalized case interview practice dashboard',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

/**
 * @requirement User Interface Design
 * Login page component with responsive layout and accessibility features
 */
export default function LoginPage() {
  const { authState, loading } = useAuth();

  // Redirect to dashboard if user is already authenticated
  if (authState.user && !loading) {
    redirect('/dashboard');
  }

  /**
   * @requirement Accessibility
   * Implements WCAG 2.1 AA compliant layout with semantic HTML and ARIA attributes
   */
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      aria-busy={loading}
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your case interview practice dashboard
          </p>
        </div>

        <LoginForm
          onSuccess={() => redirect('/dashboard')}
          className="mt-8 space-y-6"
        />

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
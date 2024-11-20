// next v13.0.0
import { Metadata } from 'next';
import Link from 'next/link';

// Internal imports
import { RegisterForm } from '../../components/auth/RegisterForm';
import Card from '../../components/shared/Card';

// Requirement: User Interface Design - SEO optimization
export const metadata: Metadata = {
  title: 'Register | Case Interview Practice Platform',
  description: 'Create your account to start practicing case interviews with AI-powered feedback and structured drills.',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'Register | Case Interview Practice Platform',
    description: 'Create your account to start practicing case interviews with AI-powered feedback and structured drills.',
    type: 'website'
  },
  alternates: {
    canonical: '/register'
  }
};

// Requirement: User Interface Design - WCAG 2.1 AA compliant registration page
export default function RegisterPage() {
  return (
    // Requirement: User Interface Design - Responsive layout with proper spacing
    <main 
      className={pageStyles}
      role="main"
      aria-labelledby="register-heading"
    >
      {/* Requirement: User Interface Design - Consistent visual patterns */}
      <div className={containerStyles}>
        {/* Requirement: User Interface Design - Card component with proper shadow and padding */}
        <Card 
          shadow="md" 
          padding="lg"
          className="w-full"
        >
          {/* Requirement: Accessibility Requirements - Proper heading hierarchy */}
          <h1 
            id="register-heading" 
            className={headingStyles}
          >
            Create your account
          </h1>

          {/* Requirement: Authentication & Authorization - Secure registration form */}
          <RegisterForm />

          {/* Requirement: Accessibility Requirements - Keyboard navigation and focus management */}
          <Link 
            href="/login" 
            className={linkStyles}
            aria-label="Already have an account? Sign in"
          >
            Already have an account? Sign in
          </Link>
        </Card>
      </div>
    </main>
  );
}

// Requirement: User Interface Design - Consistent styling with design system
const pageStyles = 'min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900';
const containerStyles = 'w-full max-w-md space-y-6';
const headingStyles = 'text-2xl font-bold text-center text-gray-900 dark:text-gray-100';
const linkStyles = 'text-sm text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 block mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500';
'use client'

// next/navigation ^13.0.0
import { useSearchParams, useRouter } from 'next/navigation'
// react ^18.0.0
import { useEffect } from 'react'

// Internal imports
import { verifyEmail } from '../../../hooks/useAuth'
import { Alert } from '../../../components/shared/Alert'

/**
 * Human Tasks:
 * 1. Configure email verification URL in Supabase project settings
 * 2. Set up proper email templates for verification emails
 * 3. Configure email sending service in production environment
 * 4. Set up monitoring for failed verification attempts
 */

// Interface for verification component state management
interface VerificationState {
  isLoading: boolean
  error: string | null
  isVerified: boolean
}

/**
 * Main verification page component that handles email verification token validation
 * Requirement: Authentication Flow - Implements secure email verification process
 */
const VerifyPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Initialize verification state
  const [state, setState] = useState<VerificationState>({
    isLoading: true,
    error: null,
    isVerified: false
  })

  /**
   * Handles the email verification process with proper error handling
   * Requirement: Authentication Flow - JWT-based verification with validation
   */
  const handleVerification = async (token: string) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Validate token format
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid verification token')
      }

      // Call verification function from useAuth hook
      await verifyEmail(token)

      // Update state on successful verification
      setState({
        isLoading: false,
        error: null,
        isVerified: true
      })

      // Redirect to login page after short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      // Format error message for display
      setState({
        isLoading: false,
        error: error.message || 'Verification failed. Please try again.',
        isVerified: false
      })
    }
  }

  /**
   * Trigger verification process on component mount
   * Requirement: User Interface Design - Proper loading states and feedback
   */
  useEffect(() => {
    if (token) {
      handleVerification(token)
    } else {
      setState({
        isLoading: false,
        error: 'No verification token provided',
        isVerified: false
      })
    }
  }, [token])

  /**
   * Render verification page with proper accessibility attributes
   * Requirement: User Interface Design - WCAG 2.1 AA compliance
   */
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      role="main"
      aria-live="polite"
    >
      <div className="max-w-md w-full space-y-8">
        {state.isLoading ? (
          <Alert
            variant="info"
            title="Verifying Email"
          >
            Please wait while we verify your email address...
          </Alert>
        ) : state.isVerified ? (
          <Alert
            variant="success"
            title="Email Verified"
          >
            Your email has been successfully verified. Redirecting to login...
          </Alert>
        ) : (
          <Alert
            variant="error"
            title="Verification Failed"
          >
            {state.error}
          </Alert>
        )}
      </div>
    </div>
  )
}

export default VerifyPage
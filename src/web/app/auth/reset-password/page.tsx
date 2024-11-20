'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from '../../../../hooks/use-form'
import { useToast } from '../../../../hooks/use-toast'
import { validatePassword, ValidationResult } from '../../../../lib/validation'
import supabase from '../../../../lib/supabase'

/**
 * Human Tasks:
 * 1. Configure password reset token expiry in Supabase dashboard
 * 2. Set up monitoring for failed password reset attempts
 * 3. Review and update password requirements periodically
 */

/**
 * @requirement Authentication System
 * Page component for password reset functionality with form validation and error handling
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetToken = searchParams.get('token')

  // Initialize toast notifications with accessibility support
  const { showToast, ToastType } = useToast()

  // Form validation configuration
  const formOptions = {
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validators: {
      password: (value: string): ValidationResult => validatePassword(value),
      confirmPassword: (value: string): ValidationResult => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          fieldErrors: {}
        }

        if (value !== formOptions.initialValues.password) {
          result.isValid = false
          result.errors.push('Passwords do not match')
          result.fieldErrors.confirmPassword = 'Passwords do not match'
        }

        return result
      }
    },
    onSubmit: handleResetPassword
  }

  // Initialize form with validation
  const {
    values,
    errors,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm(formOptions)

  /**
   * @requirement Authentication System
   * Handles the password reset submission with validation and error handling
   */
  async function handleResetPassword(values: Record<string, string>) {
    if (!resetToken) {
      showToast('Invalid or expired reset token', ToastType.ERROR)
      router.push('/auth/login')
      return
    }

    // Validate new password
    const passwordValidation = validatePassword(values.password)
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.errors[0], ToastType.ERROR)
      return
    }

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: values.password
      })

      if (error) {
        throw error
      }

      showToast(
        'Password has been successfully reset. Please log in with your new password.',
        ToastType.SUCCESS
      )
      router.push('/auth/login')
    } catch (error) {
      showToast(
        'Failed to reset password. Please try again or request a new reset link.',
        ToastType.ERROR
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="New Password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm New Password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-password-error' : undefined
                }
              />
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                !isValid || isSubmitting
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
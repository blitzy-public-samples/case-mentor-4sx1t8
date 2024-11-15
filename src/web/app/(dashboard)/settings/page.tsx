/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - react-hook-form ^7.0.0
 * 2. Ensure proper ARIA labels are tested with screen readers
 * 3. Test keyboard navigation flow through all form elements
 * 4. Verify color contrast ratios meet WCAG 2.1 AA standards
 */

'use client'

import * as React from 'react' // ^18.0.0
import { useForm } from 'react-hook-form' // ^7.0.0
import { buttonVariants } from '../../components/shared/Button'
import Card from '../../components/shared/Card'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

// Requirement: User Management - Profile customization and preferences
interface ProfileFormData {
  name: string
  email: string
  avatar?: string
}

// Requirement: User Management - Notification preferences
interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
}

// Requirement: User Management - Profile customization and user preferences management
const SettingsPage = () => {
  // Initialize form state with react-hook-form
  const profileForm = useForm<ProfileFormData>()
  const notificationForm = useForm<NotificationSettings>()

  // Get auth state and toast notifications
  const { state: authState, logout } = useAuth()
  const { show: showToast, ToastType } = useToast()

  // Set initial form values from auth state
  React.useEffect(() => {
    if (authState.user) {
      profileForm.reset({
        name: authState.user.name,
        email: authState.user.email,
        avatar: authState.user.avatar
      })

      notificationForm.reset({
        emailNotifications: authState.user.preferences?.emailNotifications ?? true,
        pushNotifications: authState.user.preferences?.pushNotifications ?? true
      })
    }
  }, [authState.user])

  // Requirement: User Management - Profile update handling
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      // Validate form data
      const isValid = await profileForm.trigger()
      if (!isValid) return

      // Submit profile updates
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update profile')

      showToast({
        type: ToastType.SUCCESS,
        message: 'Profile updated successfully'
      })
    } catch (error) {
      showToast({
        type: ToastType.ERROR,
        message: 'Failed to update profile'
      })
    }
  }

  // Requirement: User Management - Notification preferences update
  const handleNotificationUpdate = async (data: NotificationSettings) => {
    try {
      // Validate notification settings
      const isValid = await notificationForm.trigger()
      if (!isValid) return

      // Update preferences in database
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      showToast({
        type: ToastType.SUCCESS,
        message: 'Notification preferences updated'
      })
    } catch (error) {
      showToast({
        type: ToastType.ERROR,
        message: 'Failed to update preferences'
      })
    }
  }

  // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant interface
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" tabIndex={0}>
        Account Settings
      </h1>

      {/* Profile Settings Section */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-6" tabIndex={0}>
          Profile Information
        </h2>
        <form
          onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              aria-describedby="name-description"
              className="w-full p-2 border rounded-md"
              {...profileForm.register('name', { required: true })}
            />
            {profileForm.formState.errors.name && (
              <p className="text-red-500 text-sm" role="alert">
                Name is required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              aria-describedby="email-description"
              className="w-full p-2 border rounded-md"
              {...profileForm.register('email', {
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              })}
            />
            {profileForm.formState.errors.email && (
              <p className="text-red-500 text-sm" role="alert">
                Valid email is required
              </p>
            )}
          </div>

          <button
            type="submit"
            className={buttonVariants({
              variant: 'primary',
              size: 'md'
            })}
            disabled={profileForm.formState.isSubmitting}
            aria-busy={profileForm.formState.isSubmitting}
          >
            Save Profile Changes
          </button>
        </form>
      </Card>

      {/* Notification Settings Section */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-6" tabIndex={0}>
          Notification Preferences
        </h2>
        <form
          onSubmit={notificationForm.handleSubmit(handleNotificationUpdate)}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="emailNotifications"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...notificationForm.register('emailNotifications')}
              />
              <label
                htmlFor="emailNotifications"
                className="ml-2 block text-sm"
              >
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="pushNotifications"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...notificationForm.register('pushNotifications')}
              />
              <label
                htmlFor="pushNotifications"
                className="ml-2 block text-sm"
              >
                Push Notifications
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={buttonVariants({
              variant: 'primary',
              size: 'md'
            })}
            disabled={notificationForm.formState.isSubmitting}
            aria-busy={notificationForm.formState.isSubmitting}
          >
            Update Notification Settings
          </button>
        </form>
      </Card>

      {/* Account Actions Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-6" tabIndex={0}>
          Account Actions
        </h2>
        <div className="space-y-4">
          <button
            onClick={logout}
            className={buttonVariants({
              variant: 'secondary',
              size: 'md'
            })}
            aria-label="Sign out of your account"
          >
            Sign Out
          </button>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
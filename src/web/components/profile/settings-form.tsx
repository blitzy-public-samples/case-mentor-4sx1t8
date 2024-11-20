// react version: ^18.0.0
// @shadcn/ui version: ^0.7.0

import React from 'react';
import { useForm } from '../../hooks/use-form';
import { Input } from '../common/input';
import { validateEmail } from '../../lib/validation';
import type { UserProfile } from '../../types/user';
import { toast } from '@shadcn/ui';

/**
 * Human Tasks:
 * 1. Configure email notification service for profile updates
 * 2. Set up monitoring for profile update failures
 * 3. Review and update form validation rules periodically
 */

/**
 * @requirement User Management
 * Props interface for the SettingsForm component
 */
interface SettingsFormProps {
  initialProfile: UserProfile;
  onSubmit: (profile: UserProfile) => Promise<void>;
}

/**
 * @requirement Form Validation
 * Validates settings form input values
 */
const validateSettings = (values: Record<string, any>) => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Validate full name
  if (!values.fullName?.trim()) {
    errors.fullName = 'Full name is required';
    isValid = false;
  }

  // Validate email format
  if (!validateEmail(values.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  // Validate target companies
  if (values.targetCompanies && Array.isArray(values.targetCompanies)) {
    if (values.targetCompanies.some((company: string) => !company.trim())) {
      errors.targetCompanies = 'Invalid company name in the list';
      isValid = false;
    }
  }

  return {
    isValid,
    errors: Object.values(errors),
    fieldErrors: errors
  };
};

/**
 * @requirement User Management
 * Profile settings form component that allows users to update their personal information
 */
const SettingsForm: React.FC<SettingsFormProps> = ({
  initialProfile,
  onSubmit
}) => {
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm({
    initialValues: initialProfile,
    validators: {
      email: validateEmail,
      fullName: (value: string) => ({
        isValid: !!value.trim(),
        errors: value.trim() ? [] : ['Full name is required'],
        fieldErrors: {}
      })
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values as UserProfile);
        toast({
          title: 'Success',
          description: 'Profile settings updated successfully',
          variant: 'success'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile settings',
          variant: 'destructive'
        });
        throw error;
      }
    }
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto"
      noValidate
    >
      {/* Full Name Input */}
      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Full Name"
        value={values.fullName}
        error={errors.fullName}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        placeholder="Enter your full name"
      />

      {/* Email Input */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        placeholder="Enter your email address"
      />

      {/* Target Interview Date */}
      <Input
        id="targetInterviewDate"
        name="targetInterviewDate"
        type="date"
        label="Target Interview Date"
        value={values.targetInterviewDate ? new Date(values.targetInterviewDate).toISOString().split('T')[0] : ''}
        error={errors.targetInterviewDate}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Select target interview date"
      />

      {/* Target Companies */}
      <div className="space-y-2">
        <label
          htmlFor="targetCompanies"
          className="block text-sm font-medium text-gray-700"
        >
          Target Companies
        </label>
        <select
          id="targetCompanies"
          name="targetCompanies"
          multiple
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={values.targetCompanies}
          onChange={handleChange}
        >
          <option value="McKinsey">McKinsey & Company</option>
          <option value="BCG">Boston Consulting Group</option>
          <option value="Bain">Bain & Company</option>
          <option value="Deloitte">Deloitte Consulting</option>
          <option value="Other">Other</option>
        </select>
        {errors.targetCompanies && (
          <p className="mt-2 text-sm text-red-600">{errors.targetCompanies}</p>
        )}
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
        
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="emailNotifications"
            className="text-sm font-medium text-gray-700"
          >
            Email Notifications
          </label>
          <input
            id="emailNotifications"
            name="preferences.emailNotifications"
            type="checkbox"
            checked={values.preferences?.emailNotifications}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="darkMode"
            className="text-sm font-medium text-gray-700"
          >
            Dark Mode
          </label>
          <input
            id="darkMode"
            name="preferences.darkMode"
            type="checkbox"
            checked={values.preferences?.darkMode}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
            ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
          `}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default SettingsForm;
// react version: ^18.0.0

import { useState, useCallback } from 'react';
import { validateEmail, validatePassword, ValidationResult } from '../lib/validation';
import type { APIError } from '../types/api';

/**
 * Human Tasks:
 * 1. Set up error tracking/monitoring for form validation failures
 * 2. Configure form submission rate limiting in the API
 * 3. Review and update validation rules periodically
 */

/**
 * @requirement Form Validation
 * Generic interface for form state management
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * @requirement Form Validation
 * Configuration options for useForm hook
 */
export interface UseFormOptions {
  initialValues: Record<string, any>;
  validators: Record<string, (value: any) => ValidationResult>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}

/**
 * @requirement Form Validation, Input Validation
 * Custom hook for form state management and validation with real-time feedback
 */
export const useForm = (options: UseFormOptions) => {
  // Initialize form state
  const [formState, setFormState] = useState<FormState>({
    values: options.initialValues,
    errors: {},
    isSubmitting: false,
    isValid: true
  });

  /**
   * @requirement Form Validation
   * Validates a single form field and returns validation result
   */
  const validateField = useCallback((name: string, value: any): ValidationResult => {
    const validator = options.validators[name];
    if (!validator) {
      return { isValid: true, errors: [], fieldErrors: {} };
    }
    return validator(value);
  }, [options.validators]);

  /**
   * @requirement Form Validation
   * Validates entire form and returns overall validation status
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formState.values).forEach(fieldName => {
      const result = validateField(fieldName, formState.values[fieldName]);
      if (!result.isValid) {
        isValid = false;
        errors[fieldName] = result.fieldErrors[fieldName] || result.errors[0];
      }
    });

    setFormState(prev => ({
      ...prev,
      errors,
      isValid
    }));

    return isValid;
  }, [formState.values, validateField]);

  /**
   * @requirement Form Validation
   * Handles input change events with real-time validation
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const validationResult = validateField(name, fieldValue);
    
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: fieldValue
      },
      errors: {
        ...prev.errors,
        [name]: validationResult.isValid ? '' : validationResult.fieldErrors[name] || validationResult.errors[0]
      }
    }));
  }, [validateField]);

  /**
   * @requirement Form Validation
   * Handles input blur events for field-level validation
   */
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const validationResult = validateField(name, value);

    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: validationResult.isValid ? '' : validationResult.fieldErrors[name] || validationResult.errors[0]
      }
    }));
  }, [validateField]);

  /**
   * @requirement Form Validation
   * Handles form submission with validation and error handling
   */
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setFormState(prev => ({
      ...prev,
      isSubmitting: true
    }));

    try {
      await options.onSubmit(formState.values);
    } catch (error) {
      const apiError = error as APIError;
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          ...apiError.details,
          submit: apiError.message
        }
      }));
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
    }
  }, [formState.values, options.onSubmit, validateForm]);

  /**
   * @requirement Form Validation
   * Resets form state to initial values
   */
  const resetForm = useCallback(() => {
    setFormState({
      values: options.initialValues,
      errors: {},
      isSubmitting: false,
      isValid: true
    });
  }, [options.initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm
  };
};
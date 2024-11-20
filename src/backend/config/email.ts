// Human Tasks:
// 1. Set up Resend API key in environment variables as RESEND_API_KEY
// 2. Verify email templates are created in Resend dashboard with matching template IDs
// 3. Configure SPF and DKIM records for the sending domain
// 4. Set up email monitoring and delivery tracking
// 5. Review and adjust rate limits based on Resend account tier

import { Resend } from 'resend'; // ^1.0.0
import { EmailConfig } from '../types/config';

// @requirement: Email Communications - Template IDs for transactional emails
export const EMAIL_TEMPLATES: Record<string, string> = {
  WELCOME: 'tmpl_welcome',
  DRILL_FEEDBACK: 'tmpl_drill_feedback',
  SIMULATION_FEEDBACK: 'tmpl_simulation_feedback',
  PASSWORD_RESET: 'tmpl_password_reset',
  SUBSCRIPTION_CONFIRMATION: 'tmpl_subscription'
} as const;

// @requirement: Email Communications - Default sender address for all system emails
export const DEFAULT_FROM_ADDRESS = 'noreply@caseinterviewpractice.com';

// @requirement: Email Communications - Rate limits for different email types (emails per minute)
export const EMAIL_RATE_LIMITS: Record<string, number> = {
  WELCOME: 1,
  FEEDBACK: 10,
  MARKETING: 5
} as const;

/**
 * Validates email configuration settings
 * @param config EmailConfig object to validate
 * @returns boolean indicating if configuration is valid
 */
export const validateEmailConfig = (config: EmailConfig): boolean => {
  // Verify API key exists and is non-empty
  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
    return false;
  }

  // Validate from address format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.fromAddress)) {
    return false;
  }

  // Verify all required templates exist
  const requiredTemplates = Object.values(EMAIL_TEMPLATES);
  const configuredTemplates = Object.values(config.templates);
  
  if (!requiredTemplates.every(template => configuredTemplates.includes(template))) {
    return false;
  }

  // Validate template ID format (must start with tmpl_)
  const templateIdRegex = /^tmpl_[a-zA-Z0-9_]+$/;
  if (!configuredTemplates.every(template => templateIdRegex.test(template))) {
    return false;
  }

  return true;
};

// @requirement: Email Communications - Email service configuration
export const emailConfig: EmailConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromAddress: DEFAULT_FROM_ADDRESS,
  templates: EMAIL_TEMPLATES
};

// Validate configuration before creating client
if (!validateEmailConfig(emailConfig)) {
  throw new Error('Invalid email configuration. Please check environment variables and template settings.');
}

// @requirement: Email Communications - Initialize Resend client for transactional emails
export const resendClient = new Resend(emailConfig.apiKey);
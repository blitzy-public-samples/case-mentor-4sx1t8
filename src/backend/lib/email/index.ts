// Human Tasks:
// 1. Set up rate limiting monitoring and alerts
// 2. Configure error tracking for failed email deliveries
// 3. Implement email bounce handling and retry logic
// 4. Set up email delivery metrics dashboard
// 5. Review and adjust rate limits based on usage patterns

import { Resend } from 'resend'; // ^1.0.0
import { generateDrillFeedbackEmail, generateSimulationFeedbackEmail } from './templates/feedback';
import { sendWelcomeEmail } from './templates/welcome';
import { emailConfig } from '../../config/email';
import { rateLimit } from '../../utils/rateLimit';

/**
 * Rate limits for different email types (emails per minute)
 * @requirement Email Communications - Rate limiting for different email types
 */
export const EMAIL_RATE_LIMITS: Record<string, number> = {
  WELCOME: 1,
  FEEDBACK: 10,
  GENERAL: 5
} as const;

/**
 * Interface for email sending options
 * @requirement Email Communications - Standardized email configuration
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Generic email sending function with rate limiting
 * @requirement Email Communications - Integration with Resend for transactional emails
 */
@rateLimit({ type: 'EMAIL', limit: 10 })
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Validate required fields
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields');
    }

    // Initialize Resend client
    const resend = new Resend(emailConfig.apiKey);

    // Prepare email data with default from address
    const emailData = {
      from: emailConfig.fromAddress,
      ...options
    };

    // Attempt to send email
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    console.info(`Email sent successfully to ${options.to}`, data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Sends feedback email for drill or simulation attempts
 * @requirement User Management - Email notifications for feedback delivery
 */
@rateLimit({ type: 'FEEDBACK', limit: 10 })
export async function sendFeedbackEmail(
  feedback: Feedback,
  userEmail: string,
  userName: string,
  drillType?: string
): Promise<boolean> {
  try {
    let emailHtml: string;
    let subject: string;

    // Generate appropriate email content based on feedback type
    if (drillType) {
      emailHtml = generateDrillFeedbackEmail(feedback, userName, drillType);
      subject = `Your ${drillType} Practice Feedback`;
    } else {
      emailHtml = generateSimulationFeedbackEmail(feedback, userName);
      subject = 'Your Case Interview Simulation Results';
    }

    // Prepare email options
    const emailOptions: EmailOptions = {
      to: userEmail,
      subject,
      html: emailHtml,
      text: `Hi ${userName}, your feedback is ready. Please view this email in an HTML-compatible email client.`
    };

    // Send email with rate limiting
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return false;
  }
}

// Re-export welcome email functionality
export { sendWelcomeEmail };
// @resend/node v1.0.0
import { Resend } from 'resend';
import { emailConfig } from '../../config/email';
import { ValidationError } from '../../lib/utils/errors';
import { logger } from '../../lib/utils/logger';

/**
 * Human Tasks:
 * 1. Ensure RESEND_API_KEY environment variable is set
 * 2. Verify sender domain in Resend dashboard
 * 3. Test email delivery in staging environment before production deployment
 */

interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResponse {
  id: string;
  success: boolean;
  error?: string;
}

export class EmailTransporter {
  private client: Resend;
  private retryPolicy: typeof emailConfig.retryPolicy;

  constructor() {
    // Requirement: Email Service - Initialize Resend client
    this.client = new Resend(emailConfig.apiKey);
    this.retryPolicy = emailConfig.retryPolicy;
    logger.info('Email transporter initialized successfully');
  }

  /**
   * Validates email options before sending
   * @throws ValidationError if options are invalid
   */
  private validateEmailOptions(options: EmailOptions): void {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate required fields
    if (!options.to) errors.push('Recipient (to) is required');
    if (!options.subject) errors.push('Subject is required');
    if (!options.html && !options.text) errors.push('Either HTML or text content is required');

    // Validate email addresses
    if (options.to && !emailRegex.test(options.to)) {
      errors.push('Invalid recipient email address');
    }
    if (options.from && !emailRegex.test(options.from)) {
      errors.push('Invalid sender email address');
    }

    // Validate CC recipients
    if (options.cc?.length) {
      options.cc.forEach((email, index) => {
        if (!emailRegex.test(email)) {
          errors.push(`Invalid CC email address at index ${index}`);
        }
      });
    }

    // Validate BCC recipients
    if (options.bcc?.length) {
      options.bcc.forEach((email, index) => {
        if (!emailRegex.test(email)) {
          errors.push(`Invalid BCC email address at index ${index}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Email validation failed', { errors });
    }
  }

  /**
   * Sends an email with retry capability
   * Requirement: External Services - Integration with Resend for email functionality
   */
  public async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      this.validateEmailOptions(options);

      // Set default from address if not provided
      const emailOptions = {
        ...options,
        from: options.from || emailConfig.defaultFrom
      };

      let lastError: Error | null = null;
      let attempt = 0;

      // Implement retry logic with exponential backoff
      while (attempt <= this.retryPolicy.maxRetries) {
        try {
          const response = await this.client.emails.send({
            from: emailOptions.from,
            to: emailOptions.to,
            subject: emailOptions.subject,
            html: emailOptions.html,
            text: emailOptions.text,
            cc: emailOptions.cc,
            bcc: emailOptions.bcc
          });

          logger.info({
            event: 'email_sent',
            emailId: response.id,
            recipient: emailOptions.to,
            attempt: attempt + 1
          });

          return {
            id: response.id,
            success: true
          };
        } catch (error) {
          lastError = error as Error;
          attempt++;

          if (attempt <= this.retryPolicy.maxRetries) {
            const delay = Math.min(
              this.retryPolicy.initialDelay * Math.pow(this.retryPolicy.backoffFactor, attempt - 1),
              this.retryPolicy.maxDelay
            );

            logger.error({
              event: 'email_retry',
              error: lastError.message,
              attempt,
              nextRetryDelay: delay
            });

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // If all retries failed
      logger.error({
        event: 'email_failure',
        error: lastError?.message,
        recipient: emailOptions.to,
        attempts: attempt
      });

      return {
        id: '',
        success: false,
        error: lastError?.message || 'Failed to send email after all retries'
      };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error({
        event: 'email_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        recipient: options.to
      });

      return {
        id: '',
        success: false,
        error: 'Internal email service error'
      };
    }
  }
}
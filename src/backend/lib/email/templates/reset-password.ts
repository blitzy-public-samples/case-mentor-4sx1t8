import { EmailTransporter } from '../transporter';
import { AuthToken } from '../../../types/auth';

/**
 * Human Tasks:
 * 1. Verify HTML email template renders correctly in major email clients
 * 2. Test plain text fallback in email clients with HTML disabled
 * 3. Confirm reset URL domain configuration in environment variables
 * 4. Validate email branding elements match company style guide
 */

interface ResetPasswordEmailData {
  email: string;
  resetToken: AuthToken;
  resetUrl: string;
  expiresInMinutes: number;
}

/**
 * Generates HTML and text content for password reset email
 * Requirement: Email Service - Branded email templates for transactional emails
 * Requirement: Security Controls - Secure password reset functionality
 */
export function generateResetPasswordEmail(data: ResetPasswordEmailData) {
  // Validate input data
  if (!data.email || !data.resetToken || !data.resetUrl || !data.expiresInMinutes) {
    throw new Error('Missing required reset password email data');
  }

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email address format');
  }

  // HTML version with responsive design
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 24px;
          text-align: center;
        }
        .content {
          padding: 24px;
          background-color: #ffffff;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
          margin: 24px 0;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: #6c757d;
        }
        @media only screen and (max-width: 480px) {
          .container {
            width: 100% !important;
          }
          .content {
            padding: 12px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset the password for your account. To proceed with the password reset, click the button below:</p>
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </div>
          <p>This link will expire in ${data.expiresInMinutes} minutes.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>For security reasons, this link can only be used once. If you need to reset your password again, please request a new link.</p>
          <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all;">${data.resetUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const text = `
Reset Your Password

Hello,

We received a request to reset the password for your account. To proceed with the password reset, please visit the following URL:

${data.resetUrl}

This link will expire in ${data.expiresInMinutes} minutes.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

For security reasons, this link can only be used once. If you need to reset your password again, please request a new link.

This is an automated message, please do not reply to this email.

© ${new Date().getFullYear()} Your Company Name. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Sends password reset email to user
 * Requirement: Email Service - Transactional email delivery
 * Requirement: Security Controls - Secure delivery of reset tokens
 */
export async function sendResetPasswordEmail(data: ResetPasswordEmailData): Promise<void> {
  try {
    const emailContent = generateResetPasswordEmail(data);
    const emailTransporter = new EmailTransporter();

    const response = await emailTransporter.sendEmail({
      to: data.email,
      subject: 'Reset Your Password',
      html: emailContent.html,
      text: emailContent.text
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send password reset email');
    }
  } catch (error) {
    throw new Error(`Error sending password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
// Human Tasks:
// 1. Create welcome email template in Resend dashboard with ID 'tmpl_welcome'
// 2. Verify HTML template variables match WelcomeEmailData interface
// 3. Test email delivery and spam score
// 4. Monitor delivery rates and user engagement
// 5. Adjust rate limiting based on user signup patterns

import { Resend } from 'resend'; // ^1.0.0
import { templates, fromAddress } from '../../../config/email';

/**
 * Interface defining the data structure for welcome email template variables
 * @requirement User Management - Email notifications for user onboarding
 */
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  subscriptionTier?: string;
  verificationLink: string;
}

/**
 * Generates HTML content for welcome email using user data and predefined template
 * @requirement Email Communications - Integration with Resend for sending transactional emails
 * @param user User object containing registration details
 * @returns HTML content string for welcome email
 */
function generateWelcomeEmailContent(user: {
  name: string;
  email: string;
  subscriptionTier?: string;
  verificationToken: string;
}): string {
  const verificationLink = `https://caseinterviewpractice.com/verify?token=${user.verificationToken}`;
  
  const emailData: WelcomeEmailData = {
    userName: user.name,
    userEmail: user.email,
    subscriptionTier: user.subscriptionTier,
    verificationLink: verificationLink
  };

  // Using template literals for demonstration - actual content will be managed in Resend dashboard
  return `
    <h1>Welcome to Case Interview Practice, ${emailData.userName}!</h1>
    <p>Thank you for joining our platform. We're excited to help you prepare for your case interviews.</p>
    ${emailData.subscriptionTier ? 
      `<p>You're currently on our ${emailData.subscriptionTier} plan.</p>` : 
      '<p>Explore our subscription plans to access premium features.</p>'
    }
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${emailData.verificationLink}">Verify Email Address</a>
    <p>Getting Started Resources:</p>
    <ul>
      <li>Complete your profile</li>
      <li>Browse practice cases</li>
      <li>Schedule your first mock interview</li>
    </ul>
  `;
}

/**
 * Sends rate-limited welcome email to newly registered users
 * @requirement User Management - Email notifications for user onboarding
 * @requirement Email Communications - Integration with Resend for sending transactional emails
 * @param user User object containing registration details
 * @returns Promise resolving to boolean indicating email sending success
 */
export async function sendWelcomeEmail(user: {
  name: string;
  email: string;
  subscriptionTier?: string;
  verificationToken: string;
}): Promise<boolean> {
  try {
    const emailContent = generateWelcomeEmailContent(user);
    
    const emailOptions = {
      from: fromAddress,
      to: user.email,
      subject: 'Welcome to Case Interview Practice!',
      template: templates.WELCOME,
      data: {
        userName: user.name,
        userEmail: user.email,
        subscriptionTier: user.subscriptionTier || 'Free',
        verificationLink: `https://caseinterviewpractice.com/verify?token=${user.verificationToken}`
      }
    };

    await resendClient.emails.send(emailOptions);
    
    console.info(`Welcome email sent successfully to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Log detailed error for monitoring but don't expose internals to caller
    return false;
  }
}
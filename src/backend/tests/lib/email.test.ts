import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import { Resend } from 'resend'; // ^1.0.0
import { 
  sendEmail, 
  sendFeedbackEmail, 
  sendWelcomeEmail,
  EMAIL_RATE_LIMITS 
} from '../../lib/email';
import { 
  generateDrillFeedbackEmail, 
  generateSimulationFeedbackEmail 
} from '../../lib/email/templates/feedback';
import { emailConfig } from '../../config/email';

// Human Tasks:
// 1. Configure test environment variables for Resend API key
// 2. Set up test email addresses for integration testing
// 3. Configure test rate limit values for CI/CD pipeline
// 4. Set up email delivery monitoring for test environments

// Mock Resend client
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

// Mock email template generators
jest.mock('../../lib/email/templates/feedback', () => ({
  generateDrillFeedbackEmail: jest.fn(),
  generateSimulationFeedbackEmail: jest.fn()
}));

describe('Email Service', () => {
  const mockResendClient = {
    emails: {
      send: jest.fn()
    }
  };

  const mockEmailOptions = {
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<p>Test content</p>'
  };

  const mockFeedback = {
    content: {
      summary: 'Test feedback summary',
      strengths: ['Strength 1', 'Strength 2'],
      improvements: ['Improvement 1'],
      detailedAnalysis: 'Detailed analysis'
    },
    score: 85,
    metrics: {
      clarity: 90,
      structure: 80,
      analysis: 85
    }
  };

  const mockUser = {
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    (Resend as jest.Mock).mockImplementation(() => mockResendClient);
    mockResendClient.emails.send.mockResolvedValue({ data: { id: 'test-id' }, error: null });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // @requirement Email Communications - Integration with Resend for transactional email communications
  test('sendEmail sends email successfully', async () => {
    mockResendClient.emails.send.mockResolvedValueOnce({
      data: { id: 'test-id' },
      error: null
    });

    const result = await sendEmail(mockEmailOptions);

    expect(result).toBe(true);
    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: emailConfig.fromAddress,
      ...mockEmailOptions
    });
  });

  // @requirement User Management - Email notifications for feedback delivery
  test('sendFeedbackEmail generates and sends drill feedback', async () => {
    const mockHtml = '<html>Mock Drill Feedback</html>';
    (generateDrillFeedbackEmail as jest.Mock).mockReturnValue(mockHtml);

    const result = await sendFeedbackEmail(
      mockFeedback,
      mockUser.email,
      mockUser.name,
      'Market Sizing'
    );

    expect(generateDrillFeedbackEmail).toHaveBeenCalledWith(
      mockFeedback,
      mockUser.name,
      'Market Sizing'
    );
    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: emailConfig.fromAddress,
      to: mockUser.email,
      subject: 'Your Market Sizing Practice Feedback',
      html: mockHtml,
      text: expect.stringContaining(mockUser.name)
    });
    expect(result).toBe(true);
  });

  // @requirement User Management - Email notifications for feedback delivery
  test('sendFeedbackEmail generates and sends simulation feedback', async () => {
    const mockHtml = '<html>Mock Simulation Feedback</html>';
    (generateSimulationFeedbackEmail as jest.Mock).mockReturnValue(mockHtml);

    const result = await sendFeedbackEmail(
      mockFeedback,
      mockUser.email,
      mockUser.name
    );

    expect(generateSimulationFeedbackEmail).toHaveBeenCalledWith(
      mockFeedback,
      mockUser.name
    );
    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: emailConfig.fromAddress,
      to: mockUser.email,
      subject: 'Your Case Interview Simulation Results',
      html: mockHtml,
      text: expect.stringContaining(mockUser.name)
    });
    expect(result).toBe(true);
  });

  // @requirement User Management - Email notifications for user management
  test('sendWelcomeEmail sends welcome email to new user', async () => {
    const result = await sendWelcomeEmail(mockUser.email, mockUser.name);

    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: emailConfig.fromAddress,
      to: mockUser.email,
      subject: expect.stringContaining('Welcome'),
      html: expect.any(String)
    });
    expect(result).toBe(true);
  });

  // @requirement Email Communications - Rate limiting and error handling
  test('email rate limiting prevents excessive sends', async () => {
    // Mock rate limit exceeded scenario
    const sendPromises = Array(EMAIL_RATE_LIMITS.GENERAL + 1)
      .fill(null)
      .map(() => sendEmail(mockEmailOptions));

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(result => result === true).length;

    expect(successfulSends).toBeLessThanOrEqual(EMAIL_RATE_LIMITS.GENERAL);
  });

  test('sendEmail handles Resend API errors gracefully', async () => {
    mockResendClient.emails.send.mockResolvedValueOnce({
      data: null,
      error: { message: 'API Error', name: 'ResendError' }
    });

    const result = await sendEmail(mockEmailOptions);

    expect(result).toBe(false);
  });

  test('sendEmail validates required fields', async () => {
    const invalidOptions = {
      to: '',
      subject: 'Test',
      html: '<p>Test</p>'
    };

    const result = await sendEmail(invalidOptions);

    expect(result).toBe(false);
    expect(mockResendClient.emails.send).not.toHaveBeenCalled();
  });

  test('sendFeedbackEmail handles template generation errors', async () => {
    (generateDrillFeedbackEmail as jest.Mock).mockImplementation(() => {
      throw new Error('Template generation failed');
    });

    const result = await sendFeedbackEmail(
      mockFeedback,
      mockUser.email,
      mockUser.name,
      'Market Sizing'
    );

    expect(result).toBe(false);
  });
});
import { APIResponse } from '../../../types/api';
import { Feedback } from '../../../models/Feedback';
import { formatScore, formatTimestamp } from '../../../utils/formatting';
import { emailConfig } from '../../../config/email';
import mjml from 'mjml'; // ^4.14.0

// Human Tasks:
// 1. Verify MJML template rendering performance for large batches
// 2. Set up monitoring for email template generation times
// 3. Configure fallback fonts for email clients
// 4. Test email template rendering across different email clients

/**
 * Email template styling constants
 * @requirement Email Communications - Consistent branding and styling
 */
const FEEDBACK_EMAIL_STYLES = {
  primaryColor: '#3B82F6',
  secondaryColor: '#22C55E',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '16px',
  lineHeight: '24px'
} as const;

/**
 * Email template copy constants
 * @requirement Email Communications - Standardized messaging
 */
const FEEDBACK_EMAIL_COPY = {
  drillSubject: 'Your Case Interview Practice Feedback',
  simulationSubject: 'Your McKinsey Simulation Results',
  greeting: 'Hi {{userName}},',
  drillIntro: "Here's your feedback for the {{drillType}} practice session:",
  simulationIntro: 'Here are your McKinsey simulation results:'
} as const;

/**
 * Generates an HTML email template for drill attempt feedback using MJML
 * @requirement User Management - Email notifications for performance feedback delivery
 */
export function generateDrillFeedbackEmail(
  feedback: Feedback,
  userName: string,
  drillType: string
): string {
  const formattedScore = formatScore(feedback.score, 2);
  const timestamp = formatTimestamp(new Date(), 'DATETIME');

  const mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>${FEEDBACK_EMAIL_COPY.drillSubject}</mj-title>
        <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
        <mj-attributes>
          <mj-all font-family="${FEEDBACK_EMAIL_STYLES.fontFamily}" font-size="${FEEDBACK_EMAIL_STYLES.fontSize}" line-height="${FEEDBACK_EMAIL_STYLES.lineHeight}" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f8fafc">
        <mj-section padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="${FEEDBACK_EMAIL_STYLES.primaryColor}" font-weight="600">
              ${FEEDBACK_EMAIL_COPY.greeting.replace('{{userName}}', userName)}
            </mj-text>
            <mj-text color="#334155">
              ${FEEDBACK_EMAIL_COPY.drillIntro.replace('{{drillType}}', drillType)}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text align="center" font-size="36px" color="${FEEDBACK_EMAIL_STYLES.secondaryColor}" font-weight="600">
              ${formattedScore}
            </mj-text>
            <mj-divider border-color="#e2e8f0" />
            <mj-text font-weight="600" color="#334155">
              Summary
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.summary}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-weight="600" color="#334155">
              Strengths
            </mj-text>
            <mj-text color="#334155">
              <ul style="padding-left: 20px; margin: 0;">
                ${feedback.content.strengths.map(strength => `<li>${strength}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-weight="600" color="#334155">
              Areas for Improvement
            </mj-text>
            <mj-text color="#334155">
              <ul style="padding-left: 20px; margin: 0;">
                ${feedback.content.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-weight="600" color="#334155">
              Detailed Analysis
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.detailedAnalysis}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#64748b" font-size="14px">
              Generated on ${timestamp}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const { html } = mjml.compile(mjmlTemplate);
  return html;
}

/**
 * Generates an HTML email template for simulation attempt feedback using MJML
 * @requirement User Management - Email notifications for performance feedback delivery
 */
export function generateSimulationFeedbackEmail(
  feedback: Feedback,
  userName: string
): string {
  const timestamp = formatTimestamp(new Date(), 'DATETIME');

  const mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>${FEEDBACK_EMAIL_COPY.simulationSubject}</mj-title>
        <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
        <mj-attributes>
          <mj-all font-family="${FEEDBACK_EMAIL_STYLES.fontFamily}" font-size="${FEEDBACK_EMAIL_STYLES.fontSize}" line-height="${FEEDBACK_EMAIL_STYLES.lineHeight}" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f8fafc">
        <mj-section padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="${FEEDBACK_EMAIL_STYLES.primaryColor}" font-weight="600">
              ${FEEDBACK_EMAIL_COPY.greeting.replace('{{userName}}', userName)}
            </mj-text>
            <mj-text color="#334155">
              ${FEEDBACK_EMAIL_COPY.simulationIntro}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-table>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 10px;">Metric</th>
                <th style="text-align: right; padding: 10px;">Score</th>
              </tr>
              ${feedback.metrics.map(metric => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px;">${metric.name}</td>
                  <td style="text-align: right; padding: 10px;">${formatScore(metric.score, 2)}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f1f5f9;">
                <td style="padding: 10px; font-weight: 600;">Overall Score</td>
                <td style="text-align: right; padding: 10px; font-weight: 600; color: ${FEEDBACK_EMAIL_STYLES.secondaryColor}">
                  ${formatScore(feedback.score, 2)}
                </td>
              </tr>
            </mj-table>
            <mj-spacer height="20px" />
            <mj-text font-weight="600" color="#334155">
              Summary
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.summary}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-weight="600" color="#334155">
              Detailed Analysis
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.detailedAnalysis}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#64748b" font-size="14px">
              Generated on ${timestamp}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const { html } = mjml.compile(mjmlTemplate);
  return html;
}
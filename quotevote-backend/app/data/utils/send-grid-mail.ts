import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { logger } from './logger';

/**
 * SendGrid Template IDs for various email types.
 * These IDs correspond to templates created in the SendGrid dashboard.
 */
export const SENDGRID_TEMPLATE_IDS = {
  INVITE_REQUEST_RECEIVED_CONFIRMATION: 'd-a7c556d6bf014115a764033690e11a01.e6d8c539-e40e-4724-a169-d4912f489afe',
  INVITATION_APPROVE: 'd-87274eb1bc824899aa350b26ad33e8eb.1064787e-b021-478b-8e14-ab7f890f0c53',
  INVITATION_DECLINE: 'd-cbac3519f74f4670915a658877550a75.aacbe956-5240-4692-ab80-d790d728f4c4',
  PASSWORD_RESET: 'd-8be5275161b04a0f85f32b8023ac727f.3f4240d3-9533-44ad-9ac0-ae25b90cee6c',
} as const;

/**
 * Union type of all valid SendGrid template IDs.
 * TypeScript will enforce that only valid template IDs can be used.
 */
export type SendGridTemplateId = typeof SENDGRID_TEMPLATE_IDS[keyof typeof SENDGRID_TEMPLATE_IDS];

/** SendGrid error detail object from API responses */
interface SendGridErrorDetail {
  message: string;
  field?: string | null;
  help?: string | null;
}

/** SendGrid API error response structure */
interface SendGridError extends Error {
  code?: number;
  response?: {
    body?: {
      errors?: SendGridErrorDetail[];
    };
  };
}

/** Type guard to check if an error is a SendGrid error */
function isSendGridError(error: unknown): error is SendGridError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

/** SendGrid personalization object for recipient-specific customization */
interface Personalization {
  to: Array<{ email: string; name?: string }>;
  dynamicTemplateData?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Email data interface for SendGrid emails.
 * 
 * Supports both direct HTML emails and template-based emails:
 * - Direct: requires to, subject, and html/text
 * - Template: requires to, templateId, and dynamicTemplateData
 */
export interface EmailData {
  /** Recipient email address - REQUIRED */
  to: string;
  
  /** Sender email address - Optional, defaults to SENDGRID_SENDER_EMAIL env var */
  from?: string;
  
  /** Email subject line - Required for non-template emails */
  subject?: string;
  
  /** Plain text version of the email */
  text?: string;
  
  /** HTML version of the email */
  html?: string;
  
  /** SendGrid template ID for template-based emails */
  templateId?: string;
  
  /** Dynamic data to populate template variables */
  dynamicTemplateData?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Result object returned by sendGridEmail function.
 * Follows the Result pattern for explicit success/error handling.
 */
export interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: unknown;
}

/**
 * Send email using SendGrid with ES8 async/await syntax
 * 
 * @param emailData - Email configuration object
 * @returns Promise that resolves with result object
 * 
 * @example
 * ```typescript
 * // Sending a simple HTML email
 * const result = await sendGridEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Welcome to Quote.Vote!</h1>'
 * });
 * 
 * // Sending a template-based email
 * const result = await sendGridEmail({
 *   to: 'user@example.com',
 *   templateId: SENDGRID_TEMPLATE_IDS.PASSWORD_RESET,
 *   dynamicTemplateData: { resetLink: 'https://...' }
 * });
 * ```
 */
import { parseEnvironmentConfig } from '../../types/environment';



const sendGridEmail = async (emailData: EmailData): Promise<EmailResult> => {
  const config = parseEnvironmentConfig(process.env);
  
  const apiKey = config.email?.sendgrid?.apiKey;
  const fromEmail = config.email?.sendgrid?.senderEmail;
  
  if (!apiKey || !fromEmail) {
    logger.error('SendGrid API key or sender email is not configured');
    throw new Error('SendGrid API key or sender email is not configured');
  }

  sgMail.setApiKey(apiKey);

  if (!emailData.to) {
    throw new Error('Recipient email (to) is required');
  }

  const from = emailData.from || `Team Quote.Vote <${fromEmail}>`;

  // Build content array from provided text/html
  const content: Array<{ type: string; value: string }> = [];
  
  if (emailData.text) {
    content.push({
      type: 'text/plain',
      value: emailData.text,
    });
  }
  
  if (emailData.html) {
    content.push({
      type: 'text/html',
      value: emailData.html,
    });
  }

  // Construct SendGrid message object
  const msg: Partial<MailDataRequired> & { personalizations?: Personalization[] } = {
    ...emailData,
    from,
    ...(content.length > 0 ? { content } : {}),
    personalizations: [
      {
        to: [{ email: emailData.to }],
        ...(emailData.dynamicTemplateData ? { dynamicTemplateData: emailData.dynamicTemplateData } : {}),
      },
    ],
  };

  logger.debug('sendGridEmail', {
    to: emailData.to,
    from: emailData.from || `Team Quote.Vote <${fromEmail}>`,
    subject: emailData.subject,
    hasTemplateId: !!emailData.templateId,
  });

  try {
    // Cast to MailDataRequired - our dynamic message building doesn't perfectly match
    // SendGrid's strict type definitions, but the runtime object conforms to the interface
    await sgMail.send(msg as MailDataRequired);
    
    logger.info('Email sent successfully', { 
      to: emailData.to, 
      subject: emailData.subject 
    });
    
    return { 
      success: true, 
      message: 'Email sent successfully' 
    };
  } catch (error: unknown) {
    if (!isSendGridError(error)) {
      logger.error('Unexpected error sending email', {
        error: String(error),
        to: emailData.to,
      });
      return {
        success: false,
        error: 'An unexpected error occurred while sending email',
        details: null,
      };
    }

    logger.error('Error sending email', {
      error: error.message,
      to: emailData.to,
      stack: error.stack,
    });

    if (error.response?.body) {
      logger.error('SendGrid API Error', {
        error: error.response.body,
        to: emailData.to,
      });

      if (error.response.body.errors) {
        error.response.body.errors.forEach((sgError: SendGridErrorDetail) => {
          if (sgError.message.includes('authorization grant is invalid')) {
            logger.error('SendGrid API Key Error: Please check your SENDGRID_API_KEY environment variable', {
              error: sgError.message,
            });
          }
        });
      }
    }

    return {
      success: false,
      error: error.message,
      details: error.response?.body ?? null,
    };
  }
};

export default sendGridEmail;

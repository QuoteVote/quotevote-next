/**
 * Unit Tests for SendGrid Email Utility */

import sendGridEmail, { 
  SENDGRID_TEMPLATE_IDS, 
  EmailData,
} from '../../app/data/utils/send-grid-mail';

// jest.mock() replaces real modules with test doubles
// This prevents actual emails from being sent during tests
jest.mock('@sendgrid/mail');
jest.mock('../../app/data/utils/logger');
jest.mock('../../app/types/environment');

import sgMail from '@sendgrid/mail';
import { logger } from '../../app/data/utils/logger';
import { parseEnvironmentConfig } from '../../app/types/environment';
import { EnvironmentConfig } from '../../app/types/environment';

describe('send-grid-mail', () => {
  const originalEnv = process.env;
  let mockConfig: EnvironmentConfig;

  // This ensures each test starts with a clean slate
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '4000',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-secret',
      SENDGRID_API_KEY: 'test-api-key-123',
      SENDGRID_SENDER_EMAIL: 'test@quote.vote',
    };

    mockConfig = {
      email: {
        sendgrid: {
          apiKey: 'test-api-key-123',
          senderEmail: 'test@quote.vote',
        },
      },
    } as EnvironmentConfig;

    (parseEnvironmentConfig as jest.Mock).mockReturnValue(mockConfig);
  });

  // Clean up to prevent tests from affecting each other
  afterEach(() => {
    process.env = originalEnv;
  });

  describe('SENDGRID_TEMPLATE_IDS', () => {
    it('should export all required template IDs', () => {
      expect(SENDGRID_TEMPLATE_IDS).toHaveProperty('INVITE_REQUEST_RECEIVED_CONFIRMATION');
      expect(SENDGRID_TEMPLATE_IDS).toHaveProperty('INVITATION_APPROVE');
      expect(SENDGRID_TEMPLATE_IDS).toHaveProperty('INVITATION_DECLINE');
      expect(SENDGRID_TEMPLATE_IDS).toHaveProperty('PASSWORD_RESET');
    });

    it('should have string values for all template IDs', () => {
      Object.values(SENDGRID_TEMPLATE_IDS).forEach(templateId => {
        expect(typeof templateId).toBe('string');
        expect(templateId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sendGridEmail', () => {
    describe('successful email sending', () => {
      it('should send a simple HTML email successfully', async () => {
        // Arrange: Set up test data
        const emailData: EmailData = {
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>This is a test</p>',
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        // Act: Call the function we're testing
        const result = await sendGridEmail(emailData);

        // Assert: Verify the results
        expect(result.success).toBe(true);
        expect(result.message).toBe('Email sent successfully');
        
        expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key-123');
        expect(sgMail.send).toHaveBeenCalledTimes(1);
        
        expect(logger.info).toHaveBeenCalledWith(
          'Email sent successfully',
          expect.objectContaining({
            to: 'test@example.com',
            subject: 'Test Email',
          })
        );
      });

      it('should send a template-based email with dynamic data', async () => {
        const emailData: EmailData = {
          to: 'user@example.com',
          templateId: SENDGRID_TEMPLATE_IDS.PASSWORD_RESET,
          dynamicTemplateData: {
            resetLink: 'https://quote.vote/reset/abc123',
            userName: 'John Doe',
          },
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        const result = await sendGridEmail(emailData);

        expect(result.success).toBe(true);
        
        // Test that the sent message includes our dynamic data
        const sendCall = mockSend.mock.calls[0][0];
        expect(sendCall).toMatchObject({
          to: 'user@example.com',
          templateId: SENDGRID_TEMPLATE_IDS.PASSWORD_RESET,
        });
      });

      it('should use default sender email when from is not provided', async () => {
        const emailData: EmailData = {
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        await sendGridEmail(emailData);

        // Access the first call's first argument
        const sendCall = mockSend.mock.calls[0][0] as unknown as Record<string, unknown>;
        expect(sendCall.from).toContain('test@quote.vote');
      });

      it('should use custom from address when provided', async () => {
        const emailData: EmailData = {
          to: 'test@example.com',
          from: 'custom@quote.vote',
          subject: 'Test',
          html: '<p>Test</p>',
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        await sendGridEmail(emailData);

        const sendCall = mockSend.mock.calls[0][0] as unknown as Record<string, unknown>;
        expect(sendCall.from).toBe('custom@quote.vote');
      });
    });

    // Test error cases (when things go wrong)
    describe('error handling', () => {
      it('should throw error when SENDGRID_API_KEY is not set', async () => {
        // Arrange: mock the config to not have sendgrid
        (parseEnvironmentConfig as jest.Mock).mockReturnValue({
          ...mockConfig,
          email: {
            ...mockConfig.email,
            sendgrid: undefined,
          },
        });

        const emailData: EmailData = {
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        };

        // Use async/await with try/catch OR Jest's rejects matcher
        await expect(sendGridEmail(emailData)).rejects.toThrow(
          'SendGrid API key or sender email is not configured'
        );

        // Verify error was logged
        expect(logger.error).toHaveBeenCalledWith(
          'SendGrid API key or sender email is not configured'
        );
      });

      it('should throw error when recipient email is missing', async () => {
        const emailData = {
          subject: 'Test',
          html: '<p>Test</p>',
        } as EmailData; // Cast to bypass TypeScript checking for this test

        await expect(sendGridEmail(emailData)).rejects.toThrow(
          'Recipient email (to) is required'
        );
      });

      it('should return error result when SendGrid API fails', async () => {
        const emailData: EmailData = {
          to: 'invalid@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        };

        // Simulate SendGrid API error
        const mockError = {
          message: 'Invalid API key',
          response: {
            body: {
              errors: [
                {
                  message: 'The provided authorization grant is invalid',
                  field: null,
                  help: null,
                },
              ],
            },
          },
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockRejectedValue(mockError);

        const result = await sendGridEmail(emailData);

        // Assert: Check error result structure
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid API key');
        expect(result.details).toEqual(mockError.response.body);

        // Verify error logging
        expect(logger.error).toHaveBeenCalledWith(
          'Error sending email',
          expect.objectContaining({
            error: 'Invalid API key',
            to: 'invalid@example.com',
          })
        );

        expect(logger.error).toHaveBeenCalledWith(
          'SendGrid API Error',
          expect.objectContaining({
            error: expect.objectContaining({
              errors: expect.arrayContaining([
                expect.objectContaining({
                  message: 'The provided authorization grant is invalid',
                }),
              ]),
            }),
          })
        );
      });

      it('should handle network errors without response body', async () => {
        const emailData: EmailData = {
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        };

        const networkError = new Error('Network timeout');

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockRejectedValue(networkError);

        const result = await sendGridEmail(emailData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
        expect(result.details).toBeNull();
      });
    });

    // Test edge cases
    describe('edge cases', () => {
      it('should handle empty dynamicTemplateData', async () => {
        const emailData: EmailData = {
          to: 'test@example.com',
          templateId: SENDGRID_TEMPLATE_IDS.INVITATION_APPROVE,
          dynamicTemplateData: {},
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        const result = await sendGridEmail(emailData);

        expect(result.success).toBe(true);
      });

      it('should log debug information before sending', async () => {
        const emailData: EmailData = {
          to: 'test@example.com',
          subject: 'Debug Test',
          html: '<p>Test</p>',
        };

        const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
        mockSend.mockResolvedValue([{}, {}] as never);

        await sendGridEmail(emailData);

        // Verify debug logging
        expect(logger.debug).toHaveBeenCalledWith(
          'sendGridEmail',
          expect.objectContaining({
            to: 'test@example.com',
            subject: 'Debug Test',
          })
        );
      });
    });
  });
});

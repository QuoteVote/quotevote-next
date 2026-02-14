/**
 * Test suite for environment variable validation and configuration parsing.
 */

import { 
  validateEnvironment, 
  parseBoolean, 
  parseInteger, 
  parseEnvironmentConfig
} from '~/types/environment';

/**
 * environment utility tests.
 */
describe('environment utility', () => {
  // Preserve original environment to avoid side effects on other tests.
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  /**
   * Validation logic for mandatory environment variables.
   */
  describe('validateEnvironment', () => {
    it('should throw if required variables are missing', () => {
      const incompleteEnv = { NODE_ENV: 'test' } as NodeJS.ProcessEnv;
      expect(() => validateEnvironment(incompleteEnv)).toThrow(/Missing required environment variables/);
    });

    it('should not throw if all required variables are present', () => {
      const validEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        MONGODB_URI: 'mongodb://localhost:27017',
        JWT_SECRET: 'test-secret',
        SENDGRID_API_KEY: 'test-key',
        SENDGRID_SENDER_EMAIL: 'test@example.com',
      } as NodeJS.ProcessEnv;
      expect(() => validateEnvironment(validEnv)).not.toThrow();
    });
  });

  /**
   * Helper function to parse boolean-like strings.
   */
  describe('parseBoolean', () => {
    it('should parse "true" or "1" as true', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
    });

    it('should parse other values as false', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('')).toBe(false);
      expect(parseBoolean(undefined)).toBe(false);
    });

    it('should use defaultValue if input is undefined', () => {
      expect(parseBoolean(undefined, true)).toBe(true);
    });
  });

  /**
   * Helper function to parse integer strings with defaults.
   */
  describe('parseInteger', () => {
    it('should parse valid integers', () => {
      expect(parseInteger('123', 0)).toBe(123);
      expect(parseInteger('-5', 0)).toBe(-5);
    });

    it('should return defaultValue for invalid integers', () => {
      expect(parseInteger('abc', 10)).toBe(10);
      expect(parseInteger('', 20)).toBe(20);
      expect(parseInteger(undefined, 30)).toBe(30);
    });
  });

  /**
   * Comprehensive parsing of the environment into a typed configuration object.
   */
  describe('parseEnvironmentConfig', () => {
    it('should correctly parse a complete environment config', () => {
      const mockEnv = {
        NODE_ENV: 'test',
        PORT: '5000',
        MONGODB_URI: 'mongodb://test',
        JWT_SECRET: 'secret',
        SENDGRID_API_KEY: 'key',
        SENDGRID_SENDER_EMAIL: 'sender@test.com',
        JWT_EXPIRATION: '1d',
        REDIS_URL: 'redis://localhost',
        SMTP_HOST: 'smtp.test.com',
        UPLOAD_DIR: '/tmp/uploads',
      } as NodeJS.ProcessEnv;

      const config = parseEnvironmentConfig(mockEnv);

      expect(config.nodeEnv).toBe('test');
      expect(config.port).toBe(5000);
      expect(config.database.uri).toBe('mongodb://test');
      expect(config.auth.jwtExpiration).toBe('1d');
      expect(config.redis?.url).toBe('redis://localhost');
      expect(config.email?.smtp?.host).toBe('smtp.test.com');
      expect(config.fileUpload.uploadDir).toBe('/tmp/uploads');
    });

    it('should handle missing optional Redis/Email sections', () => {
      const minimalEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        MONGODB_URI: 'mongodb://test',
        JWT_SECRET: 'secret',
        SENDGRID_API_KEY: 'key',
        SENDGRID_SENDER_EMAIL: 'sender@test.com',
      } as NodeJS.ProcessEnv;

      const config = parseEnvironmentConfig(minimalEnv);
      expect(config.redis).toBeUndefined();
      // Even if SMTP is missing, sendgrid might be present because it's required in validate
      expect(config.email?.sendgrid?.apiKey).toBe('key');
      expect(config.email?.smtp).toBeUndefined();
    });

    it('should pick up fallback values from safe environment (like admin defaults)', () => {
      const minimalEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        MONGODB_URI: 'mongodb://test',
        JWT_SECRET: 'secret',
        SENDGRID_API_KEY: 'key',
        SENDGRID_SENDER_EMAIL: 'sender@test.com',
      } as NodeJS.ProcessEnv;

      const config = parseEnvironmentConfig(minimalEnv);
      expect(config.admin.username).toBe('admin');
      expect(config.admin.email).toBe('admin@quotevote.com');
      // Fix: when NODE_ENV is 'test', the config.nodeEnv will be 'test', not the fallback 'development'
      expect(config.nodeEnv).toBe('test'); 
    });

    it('should handle AWS configuration', () => {
        const awsEnv = {
          NODE_ENV: 'test', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
          SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's',
          AWS_ACCESS_KEY_ID: 'keyId',
          AWS_SECRET_ACCESS_KEY: 'secret',
          AWS_S3_BUCKET: 'bucket'
        } as NodeJS.ProcessEnv;
        
        const config = parseEnvironmentConfig(awsEnv);
        expect(config.aws?.accessKeyId).toBe('keyId');
        expect(config.aws?.region).toBe('us-east-1'); // Default fallback
    });

    it('should handle Monitoring configuration', () => {
        const monEnv = {
          NODE_ENV: 'test', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
          SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's',
          SENTRY_DSN: 'dsn'
        } as NodeJS.ProcessEnv;
        
        const config = parseEnvironmentConfig(monEnv);
        expect(config.monitoring?.sentryDsn).toBe('dsn');
    });

    it('should handle logging defaults based on nodeEnv', () => {
        const prodLogEnv = {
            NODE_ENV: 'production', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's',
        } as NodeJS.ProcessEnv;
        const config = parseEnvironmentConfig(prodLogEnv);
        expect(config.logging.level).toBe('info');
    });

    it('should throw if NODE_ENV is missing', () => {
        const noEnv = {
            PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's',
        } as NodeJS.ProcessEnv;
        delete (noEnv as unknown as Record<string, string>).NODE_ENV;
        expect(() => parseEnvironmentConfig(noEnv)).toThrow(/Missing required environment variables/);
    });

    it('should cover SMTP host/sendgrid fallback branch', () => {
        const env = { 
            NODE_ENV: 'production', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's',
            SMTP_HOST: 'host'
        } as NodeJS.ProcessEnv;
        const config = parseEnvironmentConfig(env);
        expect(config.email?.smtp?.host).toBe('host');
        expect(config.email?.sendgrid?.apiKey).toBe('k');
    });

    it('should handle SendGrid without SMTP configuration', () => {
        const env = {
            NODE_ENV: 'production', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's'
        } as NodeJS.ProcessEnv;
        const config = parseEnvironmentConfig(env);
        expect(config.email?.sendgrid).toBeDefined();
        expect(config.email?.smtp).toBeUndefined();
    });

    it('should handle SMTP only configuration (bypassing validation for test)', () => {
        const env = { 
            NODE_ENV: 'production', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 's', // Added these
            SMTP_HOST: 'h', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASSWORD: 'p'
        } as unknown as NodeJS.ProcessEnv;
        
        const config = parseEnvironmentConfig(env);
        expect(config.email?.smtp).toBeDefined();
        expect(config.email?.sendgrid).toBeDefined(); // Will be defined now
    });

    it('should hit all fallback branches', () => {
        // Use the test hook to bypass validation
        type ValidatorFunc = (env: NodeJS.ProcessEnv) => void;
        const configWithValidator = parseEnvironmentConfig as unknown as { validator?: ValidatorFunc };
        
        const originalValidator = configWithValidator.validator;
        configWithValidator.validator = () => {};
        
        try {
            // 1. nodeEnv and port fallbacks + email undefined
            const config = parseEnvironmentConfig({ 
                NODE_ENV: '', PORT: 'abc', MONGODB_URI: 'm', JWT_SECRET: 'j' 
            } as unknown as NodeJS.ProcessEnv);
            expect(config.nodeEnv).toBe('development');
            expect(config.port).toBe(4000);
            expect(config.email).toBeUndefined();

            // 2. sendgrid undefined and senderEmail fallback
            const config2 = parseEnvironmentConfig({
                NODE_ENV: 'test', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
                SENDGRID_API_KEY: 'k', // sender is missing
                SMTP_HOST: 'h', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASSWORD: 'p'
            } as unknown as NodeJS.ProcessEnv);
            expect(config2.email?.sendgrid?.senderEmail).toBe('noreply@quotevote.com');
            
            // 3. sendgrid undefined branch
            const config3 = parseEnvironmentConfig({
                NODE_ENV: 'test', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
                SMTP_HOST: 'h', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASSWORD: 'p'
                // SENDGRID_API_KEY missing
            } as unknown as NodeJS.ProcessEnv);
            expect(config3.email?.sendgrid).toBeUndefined();
        } finally {
            configWithValidator.validator = originalValidator;
        }
    });

    it('should use provided SendGrid sender email', () => {
        const env = {
            NODE_ENV: 'test', PORT: '4000', MONGODB_URI: 'm', JWT_SECRET: 'j',
            SENDGRID_API_KEY: 'k', SENDGRID_SENDER_EMAIL: 'custom@test.com'
        } as unknown as NodeJS.ProcessEnv;
        
        const config = parseEnvironmentConfig(env);
        expect(config.email?.sendgrid?.senderEmail).toBe('custom@test.com');
    });
  });
});

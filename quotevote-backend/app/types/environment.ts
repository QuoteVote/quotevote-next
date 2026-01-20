/**
 * Environment Types
 * TypeScript definitions for environment variables and configuration
 */

// ============================================================================
// Environment Variable Types
// ============================================================================

/**
 * Strongly-typed process.env interface
 * All environment variables should be defined here
 */
export interface EnvironmentVariables {
  // Node Environment
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;

  // Database
  MONGODB_URI: string;
  MONGODB_DB_NAME?: string;

  // Authentication & Security
  JWT_SECRET: string;
  JWT_EXPIRATION?: string;
  SESSION_SECRET?: string;
  COOKIE_SECRET?: string;
  BCRYPT_SALT_ROUNDS?: string;

  // GraphQL
  GRAPHQL_PATH?: string;
  GRAPHQL_SUBSCRIPTIONS_PATH?: string;
  GRAPHQL_PLAYGROUND_ENABLED?: string;

  // CORS
  CORS_ORIGIN?: string;
  CORS_CREDENTIALS?: string;

  // Redis (for sessions/caching)
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;

  // Email Service
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM_EMAIL?: string;
  SENDGRID_API_KEY?: string;

  // AWS (if using S3 for file storage)
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;

  // File Upload
  MAX_FILE_SIZE?: string;
  UPLOAD_DIR?: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;

  // Logging
  LOG_LEVEL?: string;
  LOG_DIR?: string;

  // External APIs
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;

  // Application URLs
  CLIENT_URL?: string;
  API_URL?: string;

  // Feature Flags
  ENABLE_SUBSCRIPTIONS?: string;
  ENABLE_FILE_UPLOADS?: string;
  ENABLE_EMAIL_VERIFICATION?: string;

  // Admin
  ADMIN_EMAIL?: string;
  ADMIN_USERNAME?: string;

  // Monitoring & Analytics
  SENTRY_DSN?: string;
  GOOGLE_ANALYTICS_ID?: string;

  // Misc
  INVITATION_CODE_LENGTH?: string;
  PASSWORD_RESET_EXPIRY?: string;
  MAX_LOGIN_ATTEMPTS?: string;
  ACCOUNT_LOCKOUT_DURATION?: string;
}

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Parsed and validated environment configuration
 */
export interface EnvironmentConfig {
  // Node Environment
  nodeEnv: 'development' | 'production' | 'test';
  port: number;

  // Database
  database: {
    uri: string;
    dbName?: string;
  };

  // Authentication
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    sessionSecret: string;
    cookieSecret: string;
    bcryptSaltRounds: number;
  };

  // GraphQL
  graphql: {
    path: string;
    subscriptionsPath: string;
    playgroundEnabled: boolean;
  };

  // CORS
  cors: {
    origin: string | string[];
    credentials: boolean;
  };

  // Redis
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
  };

  // Email
  email?: {
    smtp?: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    };
    sendgrid?: {
      apiKey: string;
    };
  };

  // AWS
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };

  // File Upload
  fileUpload: {
    maxFileSize: number;
    uploadDir: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging
  logging: {
    level: string;
    dir: string;
  };

  // URLs
  urls: {
    client: string;
    api: string;
  };

  // Feature Flags
  features: {
    subscriptions: boolean;
    fileUploads: boolean;
    emailVerification: boolean;
  };

  // Admin
  admin: {
    email: string;
    username: string;
  };

  // Security
  security: {
    invitationCodeLength: number;
    passwordResetExpiry: number;
    maxLoginAttempts: number;
    accountLockoutDuration: number;
  };

  // Monitoring
  monitoring?: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
  };
}

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Required environment variables that must be present
 */
export const REQUIRED_ENV_VARS: Array<keyof EnvironmentVariables> = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
];

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variable is missing
 */
export function validateEnvironment(env: NodeJS.ProcessEnv): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * Parses a boolean environment variable
 */
export function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parses an integer environment variable
 */
export function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parses environment variables into a typed configuration object
 */
export function parseEnvironmentConfig(env: NodeJS.ProcessEnv): EnvironmentConfig {
  validateEnvironment(env);

  return {
    nodeEnv: (env.NODE_ENV as EnvironmentConfig['nodeEnv']) || 'development',
    port: parseInteger(env.PORT, 4000),

    database: {
      uri: env.MONGODB_URI!,
      dbName: env.MONGODB_DB_NAME,
    },

    auth: {
      jwtSecret: env.JWT_SECRET!,
      jwtExpiration: env.JWT_EXPIRATION || '7d',
      sessionSecret: env.SESSION_SECRET || env.JWT_SECRET!,
      cookieSecret: env.COOKIE_SECRET || env.JWT_SECRET!,
      bcryptSaltRounds: parseInteger(env.BCRYPT_SALT_ROUNDS, 10),
    },

    graphql: {
      path: env.GRAPHQL_PATH || '/graphql',
      subscriptionsPath: env.GRAPHQL_SUBSCRIPTIONS_PATH || '/graphql',
      playgroundEnabled: parseBoolean(
        env.GRAPHQL_PLAYGROUND_ENABLED,
        env.NODE_ENV !== 'production'
      ),
    },

    cors: {
      origin: env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: parseBoolean(env.CORS_CREDENTIALS, true),
    },

    redis:
      env.REDIS_URL || env.REDIS_HOST
        ? {
            url: env.REDIS_URL,
            host: env.REDIS_HOST,
            port: parseInteger(env.REDIS_PORT, 6379),
            password: env.REDIS_PASSWORD,
          }
        : undefined,

    email:
      env.SMTP_HOST || env.SENDGRID_API_KEY
        ? {
            smtp: env.SMTP_HOST
              ? {
                  host: env.SMTP_HOST,
                  port: parseInteger(env.SMTP_PORT, 587),
                  user: env.SMTP_USER!,
                  password: env.SMTP_PASSWORD!,
                  from: env.SMTP_FROM_EMAIL || 'noreply@quotevote.com',
                }
              : undefined,
            sendgrid: env.SENDGRID_API_KEY
              ? {
                  apiKey: env.SENDGRID_API_KEY,
                }
              : undefined,
          }
        : undefined,

    aws: env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
          region: env.AWS_REGION || 'us-east-1',
          s3Bucket: env.AWS_S3_BUCKET!,
        }
      : undefined,

    fileUpload: {
      maxFileSize: parseInteger(env.MAX_FILE_SIZE, 5 * 1024 * 1024), // 5MB default
      uploadDir: env.UPLOAD_DIR || './uploads',
    },

    rateLimit: {
      windowMs: parseInteger(env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
      maxRequests: parseInteger(env.RATE_LIMIT_MAX_REQUESTS, 100),
    },

    logging: {
      level: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
      dir: env.LOG_DIR || './logs',
    },

    urls: {
      client: env.CLIENT_URL || 'http://localhost:3000',
      api: env.API_URL || 'http://localhost:4000',
    },

    features: {
      subscriptions: parseBoolean(env.ENABLE_SUBSCRIPTIONS, true),
      fileUploads: parseBoolean(env.ENABLE_FILE_UPLOADS, true),
      emailVerification: parseBoolean(env.ENABLE_EMAIL_VERIFICATION, false),
    },

    admin: {
      email: env.ADMIN_EMAIL || 'admin@quotevote.com',
      username: env.ADMIN_USERNAME || 'admin',
    },

    security: {
      invitationCodeLength: parseInteger(env.INVITATION_CODE_LENGTH, 8),
      passwordResetExpiry: parseInteger(env.PASSWORD_RESET_EXPIRY, 3600000), // 1 hour
      maxLoginAttempts: parseInteger(env.MAX_LOGIN_ATTEMPTS, 5),
      accountLockoutDuration: parseInteger(env.ACCOUNT_LOCKOUT_DURATION, 900000), // 15 minutes
    },

    monitoring:
      env.SENTRY_DSN || env.GOOGLE_ANALYTICS_ID
        ? {
            sentryDsn: env.SENTRY_DSN,
            googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
          }
        : undefined,
  };
}

// ============================================================================
// Type Augmentation for process.env
// ============================================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends Partial<EnvironmentVariables> {}
  }
}

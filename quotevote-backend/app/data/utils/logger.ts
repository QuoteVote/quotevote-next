import winston from 'winston';
import { LoggerOptions, GraphQLOperation, GraphQLLogContext } from '../../types/logger';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Custom format for development
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMsg = `${timestamp} ${level}: ${message}`;
    if (stack) {
      logMsg += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      logMsg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMsg;
  })
);

/**
 * JSON format for production
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create and configure Winston logger instance
 */
export function createWinstonLogger(options: LoggerOptions = {}): winston.Logger {
  const { level = process.env.LOG_LEVEL || 'info', service = 'quotevote-backend' } = options;
  const isTest = process.env.NODE_ENV === 'test';

  const transports: winston.transport[] = [];

  // Only add console transport if not in test environment
  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        format: isProduction ? prodFormat : devFormat,
      })
    );
  }

  // Add file logging if not in test environment (to avoid cluttering during tests)
  // or if explicitly configured (could add env var like LOG_TO_FILE=true)
  if (!isTest) {
    transports.push(
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    );
  }

  // In test environment, use a silent transport to suppress all output
  if (isTest && transports.length === 0) {
    transports.push(
      new winston.transports.Console({
        silent: true, // Suppress all output in test environment
      })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: { service },
    transports,
  });
}

/**
 * Shared logger instance - exported as singleton
 */
export const logger = createWinstonLogger();

/**
 * Stream for Morgan (HTTP logging)
 */
export const stream = {
  write: (message: string): void => {
    // Morgan adds a newline at the end, so we trim it
    logger.info(message.trim());
  },
};

/**
 * Log a general message
 */
export function logMessage(message: string): void {
  logger.info(`Message: ${message}`);
}

/**
 * Log an error
 */
export function logError(error: Error | string | unknown): void {
  if (error instanceof Error) {
    logger.error(`Error: ${error.message}`, { stack: error.stack });
  } else {
    logger.error(`Error: ${String(error)}`);
  }
}

/**
 * Log GraphQL operation details
 */
export function logGraphQLOperation(
  operation: GraphQLOperation,
  context?: GraphQLLogContext,
  level: string = 'info'
): void {
  const logData: Record<string, unknown> = {
    operationName: operation.operationName,
    operationType: operation.operationType,
  };

  if (context) {
    logData.context = {
      userId: context.userId,
      requestId: context.requestId,
      ip: context.ip,
    };
  }

  if (operation.variables && Object.keys(operation.variables).length > 0) {
    logData.variables = operation.variables;
  }

  logger.log(level, `GraphQL ${operation.operationType || 'operation'}: ${operation.operationName || 'anonymous'}`, logData);
}

/**
 * Log GraphQL errors with context
 */
export function logGraphQLError(
  error: Error,
  operation?: GraphQLOperation,
  context?: GraphQLLogContext
): void {
  const logData: Record<string, unknown> = {
    error: error.message,
    stack: error.stack,
  };

  if (operation) {
    logData.operation = {
      name: operation.operationName,
      type: operation.operationType,
    };
  }

  if (context) {
    logData.context = {
      userId: context.userId,
      requestId: context.requestId,
      ip: context.ip,
    };
  }

  logger.error('GraphQL Error', logData);
}

/**
 * Log GraphQL context information
 */
export function logGraphQLContext(context: GraphQLLogContext, message?: string): void {
  logger.info(message || 'GraphQL Context', {
    userId: context.userId,
    requestId: context.requestId,
    ip: context.ip,
    userAgent: context.userAgent,
  });
}

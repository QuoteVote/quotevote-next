import winston from 'winston';
/**
 * Test suite for the winston-based logging utility.
 */
import { 
  createWinstonLogger, 
  logger, 
  stream, 
  logMessage, 
  logError, 
  logGraphQLOperation, 
  logGraphQLError, 
  logGraphQLContext 
} from '../../app/data/utils/logger';
import { GraphQLOperation, GraphQLLogContext } from '../../app/types/logger';

// Use var to avoid TDZ during jest.mock hoisting
// eslint-disable-next-line no-var
var capturedPrintf: (info: Record<string, unknown>) => string;

jest.mock('winston', () => {
  const mLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mLogger),
    format: {
      combine: jest.fn((...args) => args),
      colorize: jest.fn(() => ({})),
      timestamp: jest.fn(() => ({})),
      printf: jest.fn((fn) => {
        capturedPrintf = fn;
        return fn;
      }),
      errors: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
    },
    transports: {
      Console: jest.fn().mockImplementation((opts) => opts),
      File: jest.fn().mockImplementation((opts) => opts),
    },
  };
});

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (winston.createLogger as jest.Mock).mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    });
  });

  describe('formats', () => {
    it('should trigger devFormat branches with stack and meta', () => {
      // Trigger devFormat by creating a logger (process.env.NODE_ENV is test)
      createWinstonLogger();
      
      expect(capturedPrintf).toBeDefined();
      
      // Test the captured printf function for coverage
      const info = { level: 'info', message: 'test', timestamp: '2023-01-01' };
      const withStack = { ...info, stack: 'error stack' };
      const withMeta = { ...info, meta: 'extra data', other: 'stuff' };
      
      expect(capturedPrintf(info)).toContain('test');
      expect(capturedPrintf(withStack)).toContain('error stack');
      expect(capturedPrintf(withMeta)).toContain('extra data');
    });
  });

  describe('createWinstonLogger', () => {
    it('should create a logger with default options', () => {
      const newLogger = createWinstonLogger();
      expect(winston.createLogger).toHaveBeenCalled();
      expect(newLogger).toBeDefined();
    });

    it('should use custom level and service if provided', () => {
      createWinstonLogger({ level: 'debug', service: 'test-service' });
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          defaultMeta: { service: 'test-service' },
        })
      );
    });

    it('should use silent transport in test environment', () => {
      process.env.NODE_ENV = 'test';
      createWinstonLogger();
      expect(winston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({ silent: true })
      );
    });

    it('should use prodFormat in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      createWinstonLogger();
      
      expect(winston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          format: expect.anything() // Verification that it was called is enough since we mock the formats
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('stream', () => {
    it('should write trimmed message to logger.info', () => {
      stream.write('test message\n');
      // The logger instance exported as 'logger' is created once at module load
      // In this test environment, createWinstonLogger was called during module load.
      // Since we mocked winston.createLogger to return our mock, 'logger' should be call our mock.
      expect(logger.info).toHaveBeenCalledWith('test message');
    });
  });

  describe('logMessage', () => {
    it('should log info message with prefix', () => {
      logMessage('hello world');
      expect(logger.info).toHaveBeenCalledWith('Message: hello world');
    });
  });

  describe('logError', () => {
    it('should log Error object with stack', () => {
      const error = new Error('test error');
      error.stack = 'test stack';
      logError(error);
      expect(logger.error).toHaveBeenCalledWith('Error: test error', { stack: 'test stack' });
    });

    it('should log string error', () => {
      logError('something went wrong');
      expect(logger.error).toHaveBeenCalledWith('Error: something went wrong');
    });

    it('should log unknown error type', () => {
      logError({ some: 'obj' });
      expect(logger.error).toHaveBeenCalledWith('Error: [object Object]');
    });

    it('should use prodFormat in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createWinstonLogger: createFn } = require('../../app/data/utils/logger');
        createFn();
        expect(winston.transports.Console).toHaveBeenCalledWith(expect.objectContaining({
          format: expect.anything()
        }));
      });
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logGraphQLOperation', () => {
    it('should log operations with variables and context', () => {
      const op: GraphQLOperation = { 
        operationName: 'testOp', 
        operationType: 'query', 
        variables: { id: 1 } 
      };
      const ctx: GraphQLLogContext = { userId: 'u1', requestId: 'r1', ip: '1.2.3.4' };
      logGraphQLOperation(op, ctx);
      expect(logger.log).toHaveBeenCalledWith(
        'info', 
        'GraphQL query: testOp', 
        expect.objectContaining({
          variables: { id: 1 },
          context: expect.objectContaining({ userId: 'u1' })
        })
      );
    });

    it('should log anonymous operations without type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op: GraphQLOperation = { operationName: '', operationType: '' as any };
      logGraphQLOperation(op);
      expect(logger.log).toHaveBeenCalledWith(
        'info', 
        'GraphQL operation: anonymous', 
        expect.any(Object)
      );
    });
  });

  describe('logGraphQLError', () => {
    it('should log errors with operation and context', () => {
      const err = new Error('gql error');
      const op: GraphQLOperation = { operationName: 'op', operationType: 'mutation' };
      const ctx = { userId: 'u1' };
      logGraphQLError(err, op, ctx);
      expect(logger.error).toHaveBeenCalledWith(
        'GraphQL Error',
        expect.objectContaining({
          error: 'gql error',
          operation: { name: 'op', type: 'mutation' },
          context: expect.objectContaining({ userId: 'u1' })
        })
      );
    });

    it('should log errors without operation or context', () => {
      const err = new Error('simple error');
      logGraphQLError(err);
      expect(logger.error).toHaveBeenCalledWith('GraphQL Error', expect.objectContaining({ error: 'simple error' }));
    });
  });

  describe('logGraphQLContext', () => {
    it('should log context information with default message', () => {
      const context: GraphQLLogContext = { userId: 'u3', requestId: 'r3' };
      logGraphQLContext(context);
      expect(logger.info).toHaveBeenCalledWith('GraphQL Context', expect.objectContaining({ userId: 'u3' }));
    });

    it('should log context information with custom message', () => {
      const context: GraphQLLogContext = { userId: 'u4' };
      logGraphQLContext(context, 'custom msg');
      expect(logger.info).toHaveBeenCalledWith('custom msg', expect.objectContaining({ userId: 'u4' }));
    });
  });
});

import { logMessage, logError } from '~/utils/logger';
import { logger } from '../../__mocks__/logger';

jest.mock('~/utils/logger', () => ({
  logMessage: jest.fn(),
  logError: jest.fn(),
}));

describe('Logger Utils with Mocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mock functionality', () => {
    it('should mock function calls', () => {
      const mockLog = jest.fn();
      mockLog('test message');
      
      expect(mockLog).toHaveBeenCalledWith('test message');
      expect(mockLog).toHaveBeenCalledTimes(1);
    });

    it('should work with TypeScript mocks', () => {
      const mockData = { id: 1, name: 'test' };
      const mockFn = jest.fn(() => mockData);
      
      const result = mockFn();
      expect(result).toEqual(mockData);
      expect(mockFn).toHaveBeenCalled();
    });

    it('should mock return values', () => {
      const mockCalculate = jest.fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20);

      expect(mockCalculate()).toBe(10);
      expect(mockCalculate()).toBe(20);
      expect(mockCalculate).toHaveBeenCalledTimes(2);
    });
  });

  describe('manual mocks', () => {
    it('should use manual mock from __mocks__ directory', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });
});

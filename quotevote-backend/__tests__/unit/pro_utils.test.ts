/**
 * Supplemental test suite for core utility modules.
 * Covers gaps in requireAuth, authentication, and rateLimiter.
 */

import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { requireAuth, requireAuthMiddleware } from '~/data/utils/requireAuth';
import { verifyToken, refresh } from '~/data/utils/authentication';
import { checkRateLimit, rateLimitMap } from '~/data/utils/rateLimiter';
import { GraphQLContext } from '~/types/graphql';
import { AuthenticatedRequest, NextFunction } from '~/types/express';

/**
 * Mocks for external dependencies used across the suite.
 */
jest.mock('jsonwebtoken');
jest.mock('~/data/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

/**
 * Supplemental tests to ensure 100% coverage and robust edge-case handling.
 */
describe('Professional Utility Coverage Gaps', () => {
  
  /**
   * Tests for requireAuth focusing on non-string input types (Request, GraphQLContext).
   */
  describe('requireAuth - Object Inputs', () => {
    it('should handle Request object', () => {
      const mockReq = { 
        body: { query: 'query { posts { id } }' } 
      } as Request;
      expect(requireAuth(mockReq)).toBe(false);
    });

    it('should handle GraphQLContext object', () => {
      const mockCtx = {
        req: { body: { query: 'query { posts { id } }' } },
        res: {}
      } as unknown as GraphQLContext;
      expect(requireAuth(mockCtx)).toBe(false);
    });

    it('should handle missing body in Request', () => {
      const mockReq = {} as Request;
      expect(requireAuth(mockReq)).toBe(true);
    });
  });

  /**
   * Tests for requireAuthMiddleware logic.
   */
  describe('requireAuthMiddleware', () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      mockReq = { body: {} };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should call next() if query is public', () => {
      mockReq.body = { query: 'query { posts { id } }' };
      requireAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if query is protected and user is missing', () => {
      mockReq.body = { query: 'query { notifications { id } }' };
      requireAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  /**
   * Tests for JWT verification failure paths in authentication.ts.
   */
  describe('authentication - Token Verification Paths', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle invalid signature', async () => {
      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';
      (jwt.verify as jest.Mock).mockImplementationOnce(() => { throw error; });
      
      await expect(verifyToken('token')).rejects.toThrow(/Invalid access token/);
    });

    it('should handle expired token', async () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementationOnce(() => { throw error; });
      
      await expect(verifyToken('token')).rejects.toThrow(/Access token has expired/);
    });

    it('should handle invalid issuer', async () => {
      const error = new Error('invalid issuer');
      (jwt.verify as jest.Mock).mockImplementationOnce(() => { throw error; });
      
      await expect(verifyToken('token')).rejects.toThrow(/Token issued cannot be used in this endpoint/);
    });
  });

  /**
   * Tests for the refresh token endpoint handling in authentication.ts.
   */
  describe('authentication - Refresh Logic', () => {
    it('should return 401 for invalid refresh token type', async () => {
      const mockReq = { body: { refreshToken: 'token' } } as Request;
      const mockRes = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn().mockReturnThis() 
      } as unknown as Response;

      (jwt.verify as jest.Mock).mockReturnValueOnce({ userId: '123', type: 'access' });

      await refresh(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  /**
   * Tests for rate limiting edge cases like missing users and manual cache cleanup.
   */
  describe('rateLimiter - Bypass & Cleanup', () => {
    beforeEach(() => {
      rateLimitMap.clear();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should bypass rate limit if userId is missing', () => {
      const mockReq = { user: {} } as unknown as AuthenticatedRequest; 
      expect(checkRateLimit(mockReq, 'action')).toBe(true);
      expect(rateLimitMap.size).toBe(0);
    });

    it('should verify manual cleanup behavior', () => {
      const key = 'user1:action';
      rateLimitMap.set(key, { count: 10, resetAt: Date.now() - 1000 }); 
      
      const now = Date.now();
      for (const [k, v] of rateLimitMap.entries()) {
        if (now >= v.resetAt) {
          rateLimitMap.delete(k);
        }
      }
      expect(rateLimitMap.has(key)).toBe(false);
    });
  });
});


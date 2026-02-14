process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as auth from '~/data/utils/authentication';
import User from '~/data/models/User';
import { logger } from '~/data/utils/logger';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('~/data/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock Mongoose User model
jest.mock('~/data/models/User', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findOneAndUpdate: jest.fn(),
    },
}));

describe('Authentication Utils', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: jest.Mock;
    let status: jest.Mock;
    let send: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        json = jest.fn().mockReturnThis();
        send = jest.fn().mockReturnThis();
        status = jest.fn().mockReturnThis();
        req = { body: {} };
        res = { status, json, send };

        // Mock ASYNC bcrypt methods
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('token');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('createGuestUser', () => {
        it('should create and return a guest user', async () => {
            (User.create as jest.Mock).mockResolvedValue({
                _id: 'mockId',
                username: 'guestUser',
                name: 'guest',
            });

            await auth.createGuestUser(req as Request, res as Response);

            expect(User.create).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'guestUser', name: 'guest' }));
        });

        it('should handle creation error', async () => {
            (User.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            await auth.createGuestUser(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ message: expect.stringMatching(/Internal server error/) });
        });
    });

    describe('register', () => {
        it('should return 400 if fields are missing', async () => {
            req.body = { username: 'test' }; // missing password etc
            await auth.register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ error_message: expect.stringMatching(/required/) }));
        });

        it('should register a new user', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockResolvedValue({
                _id: 'newId',
                name: 'Test',
                email: 'test@example.com',
                username: 'testuser',
            });

            req.body = {
                name: 'Test',
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            };

            await auth.register(req as Request, res as Response);

            expect(User.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle duplicate user', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({ username: 'testuser' });
            req.body = {
                name: 'Test',
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            };

            await auth.register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should handle generic error during registration', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockRejectedValue(new Error('Unexpected'));
            req.body = { name: 'n', email: 'e', username: 'u', password: 'p' };
            await auth.register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('generateHashPassword', () => {
        it('should call bcrypt hash async', async () => {
            const result = await auth.generateHashPassword('password');
            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalled();
            expect(result).toBe('hashed');
        });
    });

    describe('login', () => {
        it('should return 400 if username missing', async () => {
            await auth.login(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

    it('should return 400 if password missing', async () => {
      const req = { body: { username: 'testuser' } } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      await auth.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password is required.' });
    });

    it('should login successfully with valid credentials', async () => {
            const mockUser = {
                _id: 'mockId',
                username: 'testuser',
                email: 'test@example.com',
                admin: false,
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            req.body = { username: 'testuser', password: 'password123' };

            await auth.login(req as Request, res as Response);

            expect(jwt.sign).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: 'token',
                refreshToken: 'token'
            }));
        });
    });

    describe('authenticate', () => {
        it('should return 400 if username missing', async () => {
      const req = { body: { password: 'pwd' } } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      await auth.authenticate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username is required.' });
    });

    it('should return 400 if fields missing', async () => {
            req.body = { username: 'test' };
            await auth.authenticate(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should authenticate successfully', async () => {
            const mockUser = {
                _id: 'mockId',
                username: 'testu',
                email: 'test@t.com',
                admin: false,
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            req.body = { username: 'testu', password: 'password' };
            await auth.authenticate(req as Request, res as Response);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: 'token',
                refreshToken: 'token'
            }));
        });
    });

    describe('addCreatorToUser extra behavior', () => {
        it('should return 401 if user not found', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            await auth.login({ body: { username: 'missing', password: 'p' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return 403 if account is disabled', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({ accountStatus: 'disabled' });
            await auth.login({ body: { username: 'bot', password: 'p' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(403);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ accountDisabled: true }));
        });

        it('should return 401 for password mismatch', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({ 
                accountStatus: 'active',
                comparePassword: jest.fn().mockResolvedValue(false)
            });
            await auth.login({ body: { username: 'user', password: 'wrong' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return token only if tokenOnly is true', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({
                _id: '123', username: 'u', email: 'e', admin: false, comparePassword: jest.fn().mockResolvedValue(true)
            });
            // Using type assertion to access exported but not normally used params if needed
            const result = await (auth as unknown as { 
                addCreatorToUser: (params: { username: string; password?: string; requirePassword?: boolean }, res: Response, auth: boolean, exp: number, only: boolean) => Promise<string> 
            }).addCreatorToUser(
                { username: 'u', password: 'p', requirePassword: true },
                res as Response,
                false,
                900,
                true
            );
            expect(result).toBe('token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a refresh token', () => {
            const payload = { userId: '123', username: 'test', email: 'test@test.com' };
            const token = auth.generateRefreshToken(payload);
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ userId: '123', type: 'refresh' }),
                expect.any(String),
                expect.objectContaining({ expiresIn: '7d' })
            );
            expect(token).toBe('token');
        });
    });

    describe('refresh', () => {
        it('should return 400 if refreshToken missing', async () => {
            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('JWT_SECRET validation', () => {
        it('should throw error if JWT_SECRET missing in production', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            const originalSecret = process.env.JWT_SECRET;
            process.env.NODE_ENV = 'production';
            delete process.env.JWT_SECRET;
            
            jest.isolateModules(() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                expect(() => require('../../app/data/utils/authentication')).toThrow('process.env.JWT_SECRET must be defined in production.');
            });
            
            process.env.NODE_ENV = originalNodeEnv;
            process.env.JWT_SECRET = originalSecret;
        });

        it('should log warning if JWT_SECRET missing in development', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            const originalSecret = process.env.JWT_SECRET;
            process.env.NODE_ENV = 'development';
            delete process.env.JWT_SECRET;
            
            jest.isolateModules(() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { logger: singletonLogger } = require('../../app/data/utils/logger');
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require('../../app/data/utils/authentication');
                expect(singletonLogger.warn).toHaveBeenCalledWith(expect.stringMatching(/Using development fallback secret/));
            });
            
            process.env.NODE_ENV = originalNodeEnv;
            process.env.JWT_SECRET = originalSecret;
        });
    });

    describe('refresh (continued)', () => {
        it('should refresh token successfully', async () => {
            req.body = { refreshToken: 'valid_refresh' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: '123', type: 'refresh' });

            const mockUser = {
                _id: '123',
                username: 'test',
                email: 'test@test.com',
                admin: false,
                accountStatus: 'active'
            };
            (User.findById as jest.Mock).mockResolvedValue(mockUser);

            await auth.refresh(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: 'token',
                refreshToken: 'valid_refresh'
            }));
        });

        it('should return 401 for invalid token type', async () => {
            req.body = { refreshToken: 'invalid_type' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: '123', type: 'access' });

            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user is not found or disabled', async () => {
            req.body = { refreshToken: 'valid' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: '123', type: 'refresh' });
            (User.findById as jest.Mock).mockResolvedValue(null);
            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);

            (User.findById as jest.Mock).mockResolvedValue({ accountStatus: 'disabled' });
            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return 401 on verification error', async () => {
            req.body = { refreshToken: 'invalid' };
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Refresh expired'); });
            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', async () => {
            const payload = { userId: '123' };
            (jwt.verify as jest.Mock).mockReturnValue(payload);
            const result = await auth.verifyToken('Bearer valid_token');
            expect(result).toEqual(payload);
        });

        it('should throw error for expired token', async () => {
            const err = new Error('token expired');
            err.name = 'TokenExpiredError';
            (jwt.verify as jest.Mock).mockImplementation(() => { throw err; });
            await expect(auth.verifyToken('token')).rejects.toThrow(/expired/);
        });

        it('should throw error for invalid signature', async () => {
            const err = new Error('invalid signature');
            err.name = 'JsonWebTokenError';
            (jwt.verify as jest.Mock).mockImplementation(() => { throw err; });
            await expect(auth.verifyToken('token')).rejects.toThrow(/Invalid access token/);
        });

        it('should throw GraphQLError for unknown errors', async () => {
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Random error'); });
            await expect(auth.verifyToken('token')).rejects.toThrow('Authentication failed');
        });

        it('should handle invalid issuer error', async () => {
            const err = new Error('invalid issuer');
            (jwt.verify as jest.Mock).mockImplementation(() => { throw err; });
            await expect(auth.verifyToken('token')).rejects.toThrow(/cannot be used in this endpoint/);
        });
    });

    describe('Additional Coverage', () => {
        it('should test toTitleCase edge cases', () => {
            expect(auth.toTitleCase('')).toBe('');
            expect(auth.toTitleCase('HELLO')).toBe('Hello');
            expect(auth.toTitleCase(null as unknown as string)).toBe('');
        });

        it('should handle registration with status disabled', async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockResolvedValue({ _id: '1', name: 'n', email: 'e', username: 'u' });
            await auth.register({ body: { name: 'n', email: 'e', username: 'u', password: 'p', status: 'disabled' } } as Request, res as Response);
            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ accountStatus: 'disabled' }));
        });

        it('should handle email username in addCreatorToUser', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({
                _id: '123', email: 'test@example.com', username: 'test', accountStatus: 'active', admin: false, comparePassword: jest.fn().mockResolvedValue(true)
            });
            await auth.addCreatorToUser({ username: 'test@example.com', password: 'p', requirePassword: true }, res as Response, false);
            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should handle missing password when required in addCreatorToUser', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({ _id: '123' });
            await auth.addCreatorToUser({ username: 'u', requirePassword: true }, res as Response, false);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should handle createGuestUser catch block with non-Error object', async () => {
            (User.create as jest.Mock).mockRejectedValue('Guest creation failed string');
            await auth.createGuestUser({ body: {} } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalledWith('createGuestUser error', expect.objectContaining({ error: 'Guest creation failed string' }));
        });

        it('should handle addCreatorToUser without password requirement', async () => {
            (User.findOne as jest.Mock).mockResolvedValue({
                _id: '123', email: 'e', username: 'u', accountStatus: 'active', admin: false, comparePassword: jest.fn().mockResolvedValue(true)
            });
            await auth.addCreatorToUser({ username: 'u', requirePassword: false }, res as Response, false);
            expect(User.findOne).toHaveBeenCalledWith({ username: 'u' });
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'token' }));
        });
    });
});

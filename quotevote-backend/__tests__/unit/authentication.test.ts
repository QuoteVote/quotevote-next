process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as auth from '~/data/utils/authentication';
import { prisma } from '~/lib/prisma';
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

// Mock Prisma client
jest.mock('~/lib/prisma', () => ({
    prisma: {
        user: {
            findOne: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            findOneAndUpdate: jest.fn(),
        },
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
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'mockId',
                username: 'guestUser',
                name: 'guest',
            });

            await auth.createGuestUser(req as Request, res as Response);

            expect(prisma.user.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'guestUser', name: 'guest' }));
        });

        it('should handle creation error', async () => {
            (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
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
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'newId',
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

            expect(prisma.user.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle duplicate user', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ username: 'testuser' });
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
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Unexpected'));
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
                id: 'mockId',
                username: 'testuser',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed',
                isAdmin: false,
                accountStatus: 'active',
                avatar: { topType: 'ShortHairShortFlat', hairColor: 'Brown' },
                bio: 'Hello',
            };
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
            req.body = { username: 'testuser', password: 'password123' };

            await auth.login(req as Request, res as Response);

            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
            expect(jwt.sign).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: 'token',
                refreshToken: 'token',
                user: expect.objectContaining({
                    username: 'testuser',
                    avatar: { topType: 'ShortHairShortFlat', hairColor: 'Brown' },
                    bio: 'Hello',
                }),
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
                id: 'mockId',
                username: 'testu',
                email: 'test@t.com',
                password: 'hashed',
                isAdmin: false,
            };
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
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
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            await auth.login({ body: { username: 'missing', password: 'p' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return 403 if account is disabled', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ accountStatus: 'disabled' });
            await auth.login({ body: { username: 'bot', password: 'p' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(403);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ accountDisabled: true }));
        });

        it('should return 401 for password mismatch', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ 
                id: '123',
                accountStatus: 'active',
                password: 'hashed',
            });
            await auth.login({ body: { username: 'user', password: 'wrong' } } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return token only if tokenOnly is true', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: '123', username: 'u', email: 'e', isAdmin: false, password: 'hashed'
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
                id: '123',
                username: 'test',
                email: 'test@test.com',
                isAdmin: false,
                accountStatus: 'active'
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

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
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            await auth.refresh(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ accountStatus: 'disabled' });
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
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', name: 'n', email: 'e', username: 'u' });
            await auth.register({ body: { name: 'n', email: 'e', username: 'u', password: 'p', status: 'disabled' } } as Request, res as Response);
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ accountStatus: 'disabled' }),
            }));
        });

        it('should handle email username in addCreatorToUser', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: '123', email: 'test@example.com', username: 'test', accountStatus: 'active', isAdmin: false, password: 'hashed'
            });
            await auth.addCreatorToUser({ username: 'test@example.com', password: 'p', requirePassword: true }, res as Response, false);
            expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        });

        it('should handle missing password when required in addCreatorToUser', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123', password: 'hashed' });
            await auth.addCreatorToUser({ username: 'u', requirePassword: true }, res as Response, false);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should handle createGuestUser catch block with non-Error object', async () => {
            (prisma.user.create as jest.Mock).mockRejectedValue('Guest creation failed string');
            await auth.createGuestUser({ body: {} } as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalledWith('createGuestUser error', expect.objectContaining({ error: 'Guest creation failed string' }));
        });

        it('should handle addCreatorToUser without password requirement', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: '123', email: 'e', username: 'u', accountStatus: 'active', isAdmin: false, password: 'hashed'
            });
            await auth.addCreatorToUser({ username: 'u', requirePassword: false }, res as Response, false);
            expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { username: 'u' } });
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'token' }));
        });
    });
});

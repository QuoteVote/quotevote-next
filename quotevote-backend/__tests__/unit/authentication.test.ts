process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as auth from '~/data/utils/authentication';
import User from '~/data/models/User';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('~/data/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Mongoose User model
jest.mock('~/data/models/User', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    },
}));



describe('Authentication Utils', () => {
    let req: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let res: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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

    describe('generateRefreshToken', () => {
        it('should generate a refresh token', () => {
            const payload = { userId: '123', username: 'test', email: 'test@test.com' };
            const token = auth.generateRefreshToken(payload as any);
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
    });

    describe('verifyToken', () => {
        it('should verify a valid token', async () => {
            const payload = { userId: '123' };
            (jwt.verify as jest.Mock).mockReturnValue(payload);
            const result = await auth.verifyToken('Bearer valid_token'); // eslint-disable-line @typescript-eslint/no-explicit-any
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
    });
});

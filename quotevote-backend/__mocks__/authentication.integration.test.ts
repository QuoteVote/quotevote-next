import { Request, Response } from 'express';
// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('~/data/utils/logger');

// Mock Mongoose User model
jest.mock('~/data/models/User', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    },
}));

import * as auth from '../app/data/utils/authentication';
import User from '../app/data/models/User';
import { logger } from '../app/data/utils/logger';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

describe('Authentication Integration Tests', () => {
    let req: any;
    let res: any;
    let json: jest.Mock;
    let status: jest.Mock;
    let send: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        json = jest.fn().mockReturnThis();
        send = jest.fn().mockReturnThis();
        status = jest.fn().mockReturnThis();
        req = { body: {}, headers: {} };
        res = {
            status,
            json,
            send,
            // Mock headers for token verification if needed
            get: jest.fn().mockImplementation((name) => {
                if (name === 'authorization') return req.headers?.authorization;
                return undefined;
            })
        };

        (jwt.sign as jest.Mock).mockReturnValue('mock_token');
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    afterEach(() => {
        // Already handled in beforeEach
    });

    describe('Full Signup -> Login -> Refresh Flow', () => {
        const testUser = {
            name: 'Integration Test',
            username: 'int_test_user',
            email: 'int@test.com',
            password: 'Password123!',
        };

        it('should complete the full authentication lifecycle', async () => {
            // 1. SIGNUP
            req.body = testUser;
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock)
                .mockResolvedValue({
                    _id: 'user_123',
                    username: testUser.username,
                    email: testUser.email,
                    name: testUser.name,
                    admin: false,
                    accountStatus: 'active',
                    comparePassword: jest.fn().mockResolvedValue(true),
                });

            await auth.register(req as Request, res as Response);

            expect(status).toHaveBeenCalledWith(201);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User registered successfully',
                user: expect.objectContaining({ username: testUser.username })
            }));

            // 2. LOGIN
            req.body = { username: testUser.username, password: testUser.password };
            const mockUserInstance = {
                ...testUser,
                _id: 'user_123',
                accountStatus: 'active',
                hashPassword: 'hashed_password',
                isAdmin: false,
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (User.findOne as jest.Mock).mockResolvedValue(mockUserInstance);

            // Directly mock bcrypt compare
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await auth.login(req as Request, res as Response);

            expect(json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
                user: expect.objectContaining({ username: testUser.username })
            }));

            const loginResponse = json.mock.calls[json.mock.calls.length - 1][0];
            const originalRefreshToken = loginResponse.refreshToken;

            // 3. REFRESH
            req.body = { refreshToken: originalRefreshToken };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user_123', type: 'refresh' });
            (User.findById as jest.Mock).mockResolvedValue(mockUserInstance);

            await auth.refresh(req as Request, res as Response);

            expect(json).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: expect.any(String),
                refreshToken: originalRefreshToken
            }));
        });

        it('should fail login with wrong password', async () => {
            req.body = { username: testUser.username, password: 'wrong_password' };
            const mockUserInstance = {
                hashPassword: 'hashed_password',
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            (User.findOne as jest.Mock).mockResolvedValue(mockUserInstance);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await auth.login(req as Request, res as Response);

            expect(status).toHaveBeenCalledWith(401);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid username or password.'
            }));
        });

        it('should fail refresh with invalid token', async () => {
            req.body = { refreshToken: 'invalid_token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid or expired refresh token');
            });

            await auth.refresh(req as Request, res as Response);

            expect(status).toHaveBeenCalledWith(401);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid or expired refresh token.'
            }));
        });
    });

    describe('Guest Access', () => {
        it('should create a guest account', async () => {
            (User.create as jest.Mock).mockResolvedValue({
                _id: 'guestId',
                username: 'random',
                name: 'guest',
            });

            await auth.createGuestUser(req as Request, res as Response);

            expect(status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                username: 'random',
                name: 'guest'
            }));
        });
    });
});

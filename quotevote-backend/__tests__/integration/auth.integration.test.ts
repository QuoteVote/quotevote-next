import request from 'supertest';
import express from 'express';
import * as auth from '../../app/data/utils/authentication';
import { prisma } from '../../app/lib/prisma';

// Setup Express app for integration testing
const app = express();
app.use(express.json());
app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);
app.post('/auth/refresh', auth.refresh);

jest.mock('../../app/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn().mockImplementation((token) => {
        if (token === 'valid_refresh') return { userId: 'mockId', type: 'refresh' };
        if (token === 'valid_access') return { userId: 'mockId', type: 'access' };
        throw new Error('Invalid token');
    })
}));
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
}));

describe('Auth Integration (Mocked DB)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'mockId',
                username: 'test',
                email: 'test@test.com',
                name: 'Test'
            });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'test',
                    password: 'password',
                    email: 'test@test.com',
                    name: 'Test'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
        });

        it('should fail if fields are missing', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ username: 'test' });
            expect(res.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login and return tokens', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: 'mockId',
                username: 'test',
                email: 'test@test.com',
                password: 'hashed_password',
                isAdmin: false
            });

            const res = await request(app)
                .post('/auth/login')
                .send({ username: 'test', password: 'password' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
        });
    });

    describe('POST /auth/refresh', () => {
        it('should refresh token', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'mockId',
                username: 'test',
                email: 'test@test.com',
                accountStatus: 'active'
            });

            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'valid_refresh' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });
    });
});

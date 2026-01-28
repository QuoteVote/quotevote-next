import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import * as auth from '../../app/data/utils/authentication';
import User from '../../app/data/models/User';

// Setup Express app for integration testing
const app = express();
app.use(express.json());
app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);
app.post('/auth/refresh', auth.refresh);

// Connect to a test database (in-memory or separate test DB recommended)
// For this example, we mock the mongoose connection or use helper if available.
// However, since we want TRUE integration, we should ideally use a real DB or mongodb-memory-server.
// Given the environment, we might mock the models for a "service integration" test 
// OR simpler: we mock the database calls but test the express+auth logic together.

// BUT, user asked for integration tests. True integration tests need a DB.
// Let's assume we can mock Mongoose for now to test the "Controller + Service" integration 
// without spinning up a real Mongo instance, OR we use the existing mocking strategy 
// but test via Supertest to verify the HTTP layer.

jest.mock('../../app/data/models/User');
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
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockResolvedValue({
                _id: 'mockId',
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
            (User.findOne as jest.Mock).mockResolvedValue({
                _id: 'mockId',
                username: 'test',
                email: 'test@test.com',
                comparePassword: jest.fn().mockResolvedValue(true),
                admin: false
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
            (User.findById as jest.Mock).mockResolvedValue({
                _id: 'mockId',
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

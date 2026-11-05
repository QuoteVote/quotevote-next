import request from 'supertest';
import express from 'express';
import * as auth from '../../app/data/utils/authentication';
import { prisma } from '../../app/lib/prisma';
import { CURRENT_TERMS_VERSION } from '../../app/data/utils/termsPolicy';

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
  }),
}));
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('Auth Integration (Mocked DB)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegistration = {
      username: 'test',
      password: 'password',
      email: 'test@test.com',
      name: 'Test',
    };

    it.each([
      ['with the current Terms version', { acceptedTermsVersion: CURRENT_TERMS_VERSION }],
      ['without a Terms version', {}],
    ])('refuses direct registration %s and creates no account', async (_label, extra) => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...validRegistration, ...extra });

      expect(res.status).toBe(403);
      expect(res.body.error_message).toMatch(/invitation-only/);
      expect(res.body).not.toHaveProperty('user');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('refuses an empty request', async () => {
      const res = await request(app).post('/auth/register').send({});

      expect(res.status).toBe(403);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return tokens', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'mockId',
        username: 'test',
        email: 'test@test.com',
        password: 'hashed_password',
        isAdmin: false,
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
        accountStatus: 'active',
      });

      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'valid_refresh' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });
});

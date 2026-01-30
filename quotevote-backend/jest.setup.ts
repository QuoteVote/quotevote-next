/// <reference types="jest" />

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});

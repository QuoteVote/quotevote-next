/**
 * Test suite for Stripe resolver utilities.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the stripe module (loaded via require inside getStripeAuth)
const mockCustomersCreate = jest.fn();
const mockPaymentMethodsCreate = jest.fn();
const MockStripe = jest.fn().mockImplementation(() => ({
  customers: { create: mockCustomersCreate },
  paymentMethods: { create: mockPaymentMethodsCreate },
}));

// Use virtual: true since stripe is not actually installed
jest.mock('stripe', () => MockStripe, { virtual: true });

describe('stripe resolver utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SANDBOX_STRIPE_SECRET_KEY = 'sk_test_sandbox123';
    process.env.LIVE_STRIPE_SECRET_KEY = 'sk_live_key456';
    process.env.STRIPE_ENVIRONMENT = 'sandbox';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getStripeAuth', () => {
    it('should use sandbox key when STRIPE_ENVIRONMENT is not production', () => {
      const { default: getStripeAuth } = require('~/data/resolvers/utils/stripe/getStripeAuth');

      const client = getStripeAuth();
      expect(MockStripe).toHaveBeenCalledWith('sk_test_sandbox123');
      expect(client).toBeDefined();
    });

    it('should use live key when STRIPE_ENVIRONMENT is production', () => {
      process.env.STRIPE_ENVIRONMENT = 'production';
      jest.resetModules();
      jest.mock('stripe', () => MockStripe, { virtual: true });
      jest.mock('~/data/utils/logger', () => ({
        logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      }));

      const { default: getStripeAuth } = require('~/data/resolvers/utils/stripe/getStripeAuth');
      getStripeAuth();
      expect(MockStripe).toHaveBeenCalledWith('sk_live_key456');
    });

    it('should throw when secret key is missing', () => {
      delete process.env.SANDBOX_STRIPE_SECRET_KEY;
      jest.resetModules();
      jest.mock('stripe', () => MockStripe, { virtual: true });
      jest.mock('~/data/utils/logger', () => ({
        logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      }));

      const { default: getStripeAuth } = require('~/data/resolvers/utils/stripe/getStripeAuth');
      expect(() => getStripeAuth()).toThrow(/Stripe secret key not configured/);
    });

    it('should throw with live label when live key is missing in production', () => {
      process.env.STRIPE_ENVIRONMENT = 'production';
      delete process.env.LIVE_STRIPE_SECRET_KEY;
      jest.resetModules();
      jest.mock('stripe', () => MockStripe, { virtual: true });
      jest.mock('~/data/utils/logger', () => ({
        logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      }));

      const { default: getStripeAuth } = require('~/data/resolvers/utils/stripe/getStripeAuth');
      expect(() => getStripeAuth()).toThrow(/Stripe secret key not configured for live/);
    });
  });

  describe('createStripePaymentMethod', () => {
    it('should create a payment method with card details', async () => {
      const mockCard = { number: '4242424242424242', exp_month: 12, exp_year: 2030 };
      const mockResult = { id: 'pm_123', type: 'card' };
      mockPaymentMethodsCreate.mockResolvedValue(mockResult);

      const { default: createStripePaymentMethod } = require('~/data/resolvers/utils/stripe/createStripePaymentMethod');
      const result = await createStripePaymentMethod(mockCard);

      expect(mockPaymentMethodsCreate).toHaveBeenCalledWith({
        type: 'card',
        card: mockCard,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('createStripeCustomer', () => {
    it('should create a customer with payment method', async () => {
      const mockPaymentMethod = { id: 'pm_123' };
      mockPaymentMethodsCreate.mockResolvedValue(mockPaymentMethod);
      const mockCustomer = { id: 'cus_123', name: 'John Doe' };
      mockCustomersCreate.mockResolvedValue(mockCustomer);

      const { default: createStripeCustomer } = require('~/data/resolvers/utils/stripe/createStripeCustomer');
      const result = await createStripeCustomer({
        stripeCustomer: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          card: { number: '4242424242424242' },
          balance: 1000,
        },
      });

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          payment_method: 'pm_123',
          balance: 1000,
        })
      );
      expect(result).toEqual(mockCustomer);
    });

    it('should include company name when provided', async () => {
      mockPaymentMethodsCreate.mockResolvedValue({ id: 'pm_456' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_456' });

      const { default: createStripeCustomer } = require('~/data/resolvers/utils/stripe/createStripeCustomer');
      await createStripeCustomer({
        stripeCustomer: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@corp.com',
          card: {},
          companyName: 'ACME Inc',
        },
      });

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Smith (ACME Inc)',
        })
      );
    });

    it('should handle missing first/last name', async () => {
      mockPaymentMethodsCreate.mockResolvedValue({ id: 'pm_789' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_789' });

      const { default: createStripeCustomer } = require('~/data/resolvers/utils/stripe/createStripeCustomer');
      await createStripeCustomer({
        stripeCustomer: {
          email: 'anon@example.com',
          card: {},
        },
      });

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '',
          email: 'anon@example.com',
          balance: 0,
        })
      );
    });
  });
});

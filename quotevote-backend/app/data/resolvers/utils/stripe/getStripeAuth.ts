// TODO: Install `stripe` package and restore typed import (issue 7.19+)
import { logger } from '~/data/utils/logger';

/**
 * Initialize and return an authenticated Stripe client.
 * Selects sandbox or live key based on STRIPE_ENVIRONMENT env var.
 */
const getStripeAuth = (): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe') as new (key: string) => unknown;
  const { SANDBOX_STRIPE_SECRET_KEY, LIVE_STRIPE_SECRET_KEY, STRIPE_ENVIRONMENT } = process.env;
  const isSandbox = STRIPE_ENVIRONMENT !== 'production';

  logger.debug('getStripeAuth', {
    isSandbox,
    hasSandboxKey: !!SANDBOX_STRIPE_SECRET_KEY,
    hasLiveKey: !!LIVE_STRIPE_SECRET_KEY,
    stripeEnvironment: STRIPE_ENVIRONMENT,
  });

  const secretKey = isSandbox ? SANDBOX_STRIPE_SECRET_KEY : LIVE_STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(`Stripe secret key not configured for ${isSandbox ? 'sandbox' : 'live'} environment`);
  }

  return new Stripe(secretKey);
};

export default getStripeAuth;

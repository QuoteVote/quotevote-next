// TODO: Install `stripe` package and restore typed import (issue 7.19+)
import getStripeAuth from './getStripeAuth';

/**
 * Create a Stripe PaymentMethod from card details.
 */
const createStripePaymentMethod = async (
  card: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const stripe = getStripeAuth() as {
    paymentMethods: { create: (params: Record<string, unknown>) => Promise<Record<string, unknown>> };
  };
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card,
  });
  return paymentMethod;
};

export default createStripePaymentMethod;

import type Stripe from 'stripe';
import getStripeAuth from './getStripeAuth';

/**
 * Create a Stripe PaymentMethod from card details.
 */
const createStripePaymentMethod = async (
  card: Stripe.PaymentMethodCreateParams.Card
): Promise<Stripe.PaymentMethod> => {
  const stripe = getStripeAuth();
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card,
  });
  return paymentMethod;
};

export default createStripePaymentMethod;

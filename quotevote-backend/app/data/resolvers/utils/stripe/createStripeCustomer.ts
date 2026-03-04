// TODO: Install `stripe` package and restore typed import (issue 7.19+)
import getStripeAuth from './getStripeAuth';
import createStripePaymentMethod from './createStripePaymentMethod';

export interface StripeCustomerInput {
  first_name?: string;
  last_name?: string;
  email: string;
  card: Record<string, unknown>;
  balance?: number;
  companyName?: string;
}

/**
 * Create a Stripe customer with a payment method attached.
 */
const createStripeCustomer = async ({
  stripeCustomer,
}: {
  stripeCustomer: StripeCustomerInput;
}): Promise<Record<string, unknown>> => {
  const stripe = getStripeAuth() as {
    customers: { create: (params: Record<string, unknown>) => Promise<Record<string, unknown>> };
  };
  const { first_name, last_name, email, card, balance, companyName } = stripeCustomer;

  const firstName = first_name || '';
  const lastName = last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const name = companyName ? `${fullName} (${companyName})` : fullName;

  const paymentMethod = await createStripePaymentMethod(card) as { id: string };

  const customer = await stripe.customers.create({
    description: name,
    name,
    email,
    payment_method: paymentMethod.id,
    balance: balance || 0,
  });

  return customer;
};

export default createStripeCustomer;

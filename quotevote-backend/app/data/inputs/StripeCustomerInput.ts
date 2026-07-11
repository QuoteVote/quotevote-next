import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { CardPaymentMethodInput } from './CardPaymentMethodInput';

export const StripeCustomerInput = new GraphQLInputObjectType({
  name: 'StripeCustomerInput',
  fields: {
    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    card: { type: new GraphQLNonNull(CardPaymentMethodInput) },
  },
});

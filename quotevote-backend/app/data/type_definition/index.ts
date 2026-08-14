import { domainTypeDefs } from '../types';
import { Query } from './query_definition';
import { Mutation } from './mutation_definition';
import { Scalar } from './scalar_definition';
import { Subscription } from './subscription_definition';

export const typeDefs = [
  domainTypeDefs,
  Query,
  Mutation,
  Subscription,
  Scalar,
  `
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`,
];

import { domainTypeDefs } from '../types';
import { Query } from './query_definition';
import { Mutation } from './mutation_definition';
import { CommonDefinitions } from './common_definitions';
import { Subscription } from './subscription_definition';
import { solidTypeDefs } from '~/data/resolvers/solidTypeDefs';

export const typeDefs = [
  domainTypeDefs,
  Query,
  Mutation,
  Subscription,
  CommonDefinitions,
  solidTypeDefs,
  `
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`,
];

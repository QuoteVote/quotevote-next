import { GraphQLSchema, GraphQLObjectType, GraphQLString, graphql } from 'graphql';
import { domainInputTypes } from './app/data/inputs';

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hello: {
      type: GraphQLString,
      resolve: () => 'world',
    },
  },
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    testPostInput: {
      type: GraphQLString,
      args: {
        input: { type: domainInputTypes.find(t => t.name === 'PostInput')! },
      },
      resolve: (_, { input }) => `Success: ${input.title}`,
    },
    testStripeInput: {
      type: GraphQLString,
      args: {
        input: { type: domainInputTypes.find(t => t.name === 'StripeCustomerInput')! },
      },
      resolve: (_, { input }) => `Success: ${input.email}`,
    },
  },
});

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
});

async function runTests() {
  console.log('Testing missing required field in PostInput...');
  const res1 = await graphql({
    schema,
    source: `
      mutation {
        testPostInput(input: {
          userId: "123",
          groupId: "456",
          title: "My Title"
          # missing required 'text' field
        })
      }
    `,
  });
  console.log(JSON.stringify(res1, null, 2));

  console.log('\nTesting complete invalid StripeCustomerInput...');
  const res2 = await graphql({
    schema,
    source: `
      mutation {
        testStripeInput(input: {
          email: "test@example.com"
          # missing first_name, card
        })
      }
    `,
  });
  console.log(JSON.stringify(res2, null, 2));
}

runTests().catch(console.error);

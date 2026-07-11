import { GraphQLSchema, GraphQLObjectType, GraphQLString, graphql } from 'graphql';
import { domainInputTypes } from '../../app/data/inputs';

describe('GraphQL Input Types Validation', () => {
  let schema: GraphQLSchema;

  beforeAll(() => {
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

    schema = new GraphQLSchema({
      query: queryType,
      mutation: mutationType,
    });
  });

  it('should fail PostInput validation if required field text is missing', async () => {
    const source = `
      mutation {
        testPostInput(input: {
          userId: "123",
          groupId: "456",
          title: "My Title"
          # missing required 'text' field
        })
      }
    `;
    const result = await graphql({ schema, source });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Field "PostInput.text" of required type "String!" was not provided.');
  });

  it('should pass PostInput validation if all required fields are present', async () => {
    const source = `
      mutation {
        testPostInput(input: {
          userId: "123",
          groupId: "456",
          title: "My Title"
          text: "Some content"
        })
      }
    `;
    const result = await graphql({ schema, source });
    expect(result.errors).toBeUndefined();
    expect(result.data?.testPostInput).toBe('Success: My Title');
  });

  it('should fail StripeCustomerInput validation if nested required field is missing', async () => {
    const source = `
      mutation {
        testStripeInput(input: {
          first_name: "John",
          email: "john@example.com",
          card: {
            number: "4242",
            exp_month: "12"
            # missing exp_year and cvc
          }
        })
      }
    `;
    const result = await graphql({ schema, source });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Field "CardPaymentMethodInput.exp_year" of required type "String!" was not provided.');
  });
});

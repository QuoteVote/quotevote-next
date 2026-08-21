import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { schema } from '~/data/schema';

describe('Executable GraphQL Schema', () => {
  it('is a valid GraphQLSchema instance', () => {
    expect(schema).toBeInstanceOf(GraphQLSchema);
  });

  it('exposes the expected Query fields', () => {
    const queryType = schema.getQueryType();
    expect(queryType).toBeInstanceOf(GraphQLObjectType);

    const fields = queryType!.getFields();
    expect(fields).toHaveProperty('hello');
    expect(fields).toHaveProperty('status');
    expect(fields).toHaveProperty('posts');
    expect(fields).toHaveProperty('activities');
    expect(fields).toHaveProperty('groups');
    expect(fields).toHaveProperty('user');
    expect(fields).toHaveProperty('searchUser');
    expect(fields).toHaveProperty('messages');
  });

  it('exposes the expected Mutation fields', () => {
    const mutationType = schema.getMutationType();
    expect(mutationType).toBeInstanceOf(GraphQLObjectType);

    const fields = mutationType!.getFields();
    expect(fields).toHaveProperty('addPost');
    expect(fields).toHaveProperty('addVote');
    expect(fields).toHaveProperty('addComment');
    expect(fields).toHaveProperty('createMessage');
    expect(fields).toHaveProperty('updateUser');
  });

  it('exposes the expected Subscription fields', () => {
    const subscriptionType = schema.getSubscriptionType();
    expect(subscriptionType).toBeInstanceOf(GraphQLObjectType);

    const fields = subscriptionType!.getFields();
    expect(fields).toHaveProperty('message');
    expect(fields).toHaveProperty('notification');
    expect(fields).toHaveProperty('presence');
    expect(fields).toHaveProperty('roster');
    expect(fields).toHaveProperty('typing');
  });

  it('registers custom scalars correctly', () => {
    const typeMap = schema.getTypeMap();
    expect(typeMap).toHaveProperty('JSON');
    expect(typeMap).toHaveProperty('Date');
    expect(typeMap).toHaveProperty('DateTime');
    expect(typeMap).toHaveProperty('ObjectId');
  });
});

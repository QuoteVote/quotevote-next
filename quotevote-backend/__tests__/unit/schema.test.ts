import {
  buildSchema,
  getIntrospectionQuery,
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  validateSchema,
} from 'graphql';
import Presence from '~/data/models/Presence';
import { schema } from '~/data/schema';

describe('Executable GraphQL Schema', () => {
  it('is a valid GraphQLSchema instance', () => {
    expect(schema).toBeInstanceOf(GraphQLSchema);
  });

  it('has no schema validation errors', () => {
    expect(validateSchema(schema)).toEqual([]);
  });

  it('supports standard introspection', async () => {
    const result = await graphql({ schema, source: getIntrospectionQuery() });

    expect(result.errors).toBeUndefined();
    expect(result.data).toHaveProperty('__schema');
  });

  it('prints and rebuilds the schema SDL', () => {
    const rebuiltSchema = buildSchema(printSchema(schema));

    expect(validateSchema(rebuiltSchema)).toEqual([]);
  });

  it('exposes the expected Query fields', () => {
    const queryType = schema.getQueryType();
    expect(queryType).toBeInstanceOf(GraphQLObjectType);

    const fields = queryType!.getFields();
    expect(fields).toHaveProperty('hello');
    expect(fields).toHaveProperty('status');
    expect(fields).toHaveProperty('posts');
    expect(fields).toHaveProperty('activities');
    expect(fields).toHaveProperty('tags');
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

  it('binds representative supported query and mutation resolvers', () => {
    const queryFields = schema.getQueryType()!.getFields();
    const mutationFields = schema.getMutationType()!.getFields();

    expect(queryFields.posts.resolve).toBeInstanceOf(Function);
    expect(queryFields.user.resolve).toBeInstanceOf(Function);
    expect(mutationFields.updateUser.resolve).toBeInstanceOf(Function);
    expect(mutationFields.heartbeat.resolve).toBeInstanceOf(Function);
  });

  it('executes representative safe queries through the production schema', async () => {
    const result = await graphql({ schema, source: '{ hello status }' });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      hello: 'Hello from TypeScript Backend! 🚀',
      status: 'Active',
    });
  });

  it('executes a mocked heartbeat mutation through the production schema', async () => {
    const lastHeartbeat = new Date('2024-01-15T12:00:00.000Z');
    const updateHeartbeatSpy = jest
      .spyOn(Presence, 'updateHeartbeat')
      .mockResolvedValue({
        lastHeartbeat,
        status: 'away',
        statusMessage: 'In a meeting',
      } as Awaited<ReturnType<typeof Presence.updateHeartbeat>>);

    try {
      const result = await graphql({
        schema,
        source: `
          mutation {
            heartbeat {
              success
              timestamp
              status
              statusMessage
            }
          }
        `,
        contextValue: {
          user: {
            _id: '60d5ec49ad414d7a8d5464a0',
          },
        },
      });

      expect(updateHeartbeatSpy).toHaveBeenCalledWith('60d5ec49ad414d7a8d5464a0');
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        heartbeat: {
          success: true,
          timestamp: lastHeartbeat.toISOString(),
          status: 'away',
          statusMessage: 'In a meeting',
        },
      });
    } finally {
      updateHeartbeatSpy.mockRestore();
    }
  });
});

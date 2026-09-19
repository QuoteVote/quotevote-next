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
    expect(fields).toHaveProperty('reportPost');
    expect(fields).toHaveProperty('reportBot');

    // Verify reportPost field configuration
    const reportPostField = fields['reportPost'];
    expect(reportPostField.type.toString()).toBe('Post');
    const reportPostArgNames = reportPostField.args.map((a) => a.name);
    expect(reportPostArgNames).toContain('postId');
    expect(reportPostArgNames).toContain('userId');

    // Verify reportBot field configuration
    const reportBotField = fields['reportBot'];
    expect(reportBotField.type.toString()).toBe('JSON');
    const reportBotArgNames = reportBotField.args.map((a) => a.name);
    expect(reportBotArgNames).toContain('userId');
    expect(reportBotArgNames).toContain('reporterId');
  });

  it('exposes reportPost and reportBot in GraphQL introspection', async () => {
    const { graphql, getIntrospectionQuery } = await import('graphql');
    const result = await graphql({
      schema,
      source: getIntrospectionQuery(),
    });

    expect(result.errors).toBeUndefined();
    const introspectionData = result.data as any;
    const mutationType = introspectionData?.__schema?.mutationType;
    expect(mutationType?.name).toBe('Mutation');

    const schemaTypes = introspectionData?.__schema?.types ?? [];
    const mutationSchemaType = schemaTypes.find((t: any) => t.name === 'Mutation');
    expect(mutationSchemaType).toBeDefined();

    const mutationFields = mutationSchemaType?.fields ?? [];
    const reportPostIntrospection = mutationFields.find((f: any) => f.name === 'reportPost');
    expect(reportPostIntrospection).toBeDefined();
    expect(reportPostIntrospection.args.map((a: any) => a.name)).toEqual(
      expect.arrayContaining(['postId', 'userId'])
    );

    const reportBotIntrospection = mutationFields.find((f: any) => f.name === 'reportBot');
    expect(reportBotIntrospection).toBeDefined();
    expect(reportBotIntrospection.args.map((a: any) => a.name)).toEqual(
      expect.arrayContaining(['userId', 'reporterId'])
    );
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

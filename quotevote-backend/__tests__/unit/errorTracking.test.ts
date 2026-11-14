import http from 'http';
import { GraphQLError } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createApolloServer } from '~/apolloServer';
import type { ErrorEvent } from '@sentry/node';
import {
  ERROR_TRACKING_DATA_COLLECTION,
  createErrorTrackingPlugin,
  initErrorTracking,
  isErrorTrackingEnabled,
  readErrorTrackingSettings,
  reportError,
  reportGraphQLErrors,
  resetErrorTrackingForTests,
  scrubBreadcrumb,
  scrubEvent,
  shouldReportGraphQLError,
  shouldReportHttpError,
  trimPrismaMessage,
} from '~/lib/errorTracking';

const scope = { setTag: jest.fn() };

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
  withScope: jest.fn((callback: (s: typeof scope) => void) => callback(scope)),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry = require('@sentry/node') as {
  init: jest.Mock;
  captureException: jest.Mock;
  withScope: jest.Mock;
};

const DSN = 'https://public@o1.ingest.example.io/42';

const located = (originalError: Error, extensions?: Record<string, unknown>): GraphQLError =>
  new GraphQLError(originalError.message, {
    originalError,
    path: ['posts', 0, 'user'],
    extensions,
  });

describe('errorTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetErrorTrackingForTests();
  });

  describe('readErrorTrackingSettings', () => {
    it('is off when SENTRY_DSN is missing or blank', () => {
      expect(readErrorTrackingSettings({ NODE_ENV: 'production' }).dsn).toBeUndefined();
      expect(readErrorTrackingSettings({ SENTRY_DSN: '  ' }).dsn).toBeUndefined();
    });

    it('uses SENTRY_ENVIRONMENT, falling back to NODE_ENV', () => {
      expect(readErrorTrackingSettings({ SENTRY_DSN: DSN, NODE_ENV: 'production' })).toEqual({
        dsn: DSN,
        environment: 'production',
        release: undefined,
      });
      expect(
        readErrorTrackingSettings({
          SENTRY_DSN: DSN,
          SENTRY_ENVIRONMENT: 'staging',
          SENTRY_RELEASE: 'abc123',
          NODE_ENV: 'production',
        })
      ).toEqual({ dsn: DSN, environment: 'staging', release: 'abc123' });
    });
  });

  describe('initErrorTracking', () => {
    it('does nothing without a DSN', () => {
      expect(initErrorTracking({})).toBe(false);
      expect(Sentry.init).not.toHaveBeenCalled();
      reportError(new Error('boom'), { source: 'http' });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('starts once, with personal data and tracing off', () => {
      expect(ERROR_TRACKING_DATA_COLLECTION).toMatchObject({
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        graphQL: { document: false, variables: false },
        stackFrameVariables: false,
      });
      expect(initErrorTracking({ dsn: DSN, environment: 'staging' })).toBe(true);
      initErrorTracking({ dsn: DSN });
      expect(Sentry.init).toHaveBeenCalledTimes(1);
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: DSN,
          environment: 'staging',
          dataCollection: ERROR_TRACKING_DATA_COLLECTION,
          tracesSampleRate: 0,
          beforeSend: expect.any(Function),
          beforeBreadcrumb: expect.any(Function),
        })
      );
      expect(isErrorTrackingEnabled()).toBe(true);
    });
  });

  describe('scrubEvent', () => {
    it('drops the user, extras, body, cookies, headers and query string', () => {
      const event = {
        type: undefined,
        user: { id: 'u1', email: 'a@example.com', ip_address: '1.2.3.4' },
        extra: { variables: { text: 'secret message' } },
        request: {
          method: 'POST',
          url: 'https://api.example.com/graphql?token=abc',
          data: '{"query":"mutation","variables":{"password":"x"}}',
          cookies: { session: 'x' },
          headers: { authorization: 'Bearer x', cookie: 'x' },
          query_string: 'token=abc',
        },
      } as unknown as ErrorEvent;

      const scrubbed = scrubEvent(event);

      expect(scrubbed.user).toBeUndefined();
      expect(scrubbed.extra).toBeUndefined();
      expect(scrubbed.request).toEqual({ method: 'POST', url: 'https://api.example.com/graphql' });
    });

    it('removes Prisma call arguments from exception messages', () => {
      const event = {
        type: undefined,
        exception: {
          values: [
            {
              type: 'PrismaClientKnownRequestError',
              value: [
                'Invalid `prisma.user.findUnique()` invocation in',
                '/app/dist/resolvers/user.js:10:5',
                '→ 10 where: { email: "person@example.com" }',
                'Record to update not found.',
              ].join('\n'),
            },
          ],
        },
      } as unknown as ErrorEvent;

      const value = scrubEvent(event).exception?.values?.[0].value;

      expect(value).toBe(
        'Invalid `prisma.user.findUnique()` invocation in Record to update not found.'
      );
      expect(value).not.toContain('person@example.com');
    });

    it('drops console breadcrumbs and query strings from request breadcrumbs', () => {
      const event = {
        type: undefined,
        breadcrumbs: [
          { category: 'console', message: 'login for person@example.com' },
          { category: 'http', data: { url: 'https://api.sendgrid.com/v3/mail/send?x=1' } },
        ],
      } as unknown as ErrorEvent;

      expect(scrubEvent(event).breadcrumbs).toEqual([
        { category: 'http', data: { url: 'https://api.sendgrid.com/v3/mail/send' } },
      ]);
      expect(scrubBreadcrumb({ category: 'console', message: 'x' })).toBeNull();
    });
  });

  describe('trimPrismaMessage', () => {
    it('leaves other messages alone', () => {
      expect(trimPrismaMessage('Cannot read properties of undefined')).toBe(
        'Cannot read properties of undefined'
      );
    });
  });

  describe('shouldReportGraphQLError', () => {
    it('reports errors a resolver threw that were not GraphQL errors', () => {
      expect(shouldReportGraphQLError(located(new TypeError('x is undefined')))).toBe(true);
    });

    it('reports errors marked INTERNAL_SERVER_ERROR', () => {
      expect(
        shouldReportGraphQLError(
          new GraphQLError('Internal server error', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          })
        )
      ).toBe(true);
    });

    it.each([
      'BAD_USER_INPUT',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'TOO_MANY_REQUESTS',
      'BAD_REQUEST',
      'GRAPHQL_VALIDATION_FAILED',
      'GRAPHQL_PARSE_FAILED',
    ])('skips %s', (code) => {
      expect(shouldReportGraphQLError(new GraphQLError('nope', { extensions: { code } }))).toBe(
        false
      );
    });

    it('skips validation errors and GraphQL errors thrown on purpose without a code', () => {
      expect(shouldReportGraphQLError(new GraphQLError('Cannot query field "x"'))).toBe(false);
      expect(shouldReportGraphQLError(located(new GraphQLError('Post not found')))).toBe(false);
    });
  });

  describe('shouldReportHttpError', () => {
    it('skips client errors such as a malformed JSON body', () => {
      expect(
        shouldReportHttpError(Object.assign(new SyntaxError('Unexpected token'), { status: 400 }))
      ).toBe(false);
      expect(shouldReportHttpError({ statusCode: 413 })).toBe(false);
    });

    it('reports server faults and errors with no status', () => {
      expect(shouldReportHttpError(new Error('boom'))).toBe(true);
      expect(shouldReportHttpError({ status: 503 })).toBe(true);
      expect(shouldReportHttpError('string thrown')).toBe(true);
    });
  });

  describe('reporting', () => {
    beforeEach(() => {
      initErrorTracking({ dsn: DSN });
    });

    it('tags the source, operation, path and route', () => {
      const error = new Error('boom');
      reportError(error, {
        source: 'graphql',
        operationName: 'posts',
        path: 'posts.0',
        route: '/graphql',
      });

      expect(scope.setTag).toHaveBeenCalledWith('source', 'graphql');
      expect(scope.setTag).toHaveBeenCalledWith('operation', 'posts');
      expect(scope.setTag).toHaveBeenCalledWith('graphql.path', 'posts.0');
      expect(scope.setTag).toHaveBeenCalledWith('route', '/graphql');
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('reports the original error of a GraphQL result, with its field path', () => {
      const original = new TypeError('x is undefined');
      reportGraphQLErrors(
        [located(original), new GraphQLError('nope', { extensions: { code: 'FORBIDDEN' } })],
        { source: 'subscription', operationName: 'message' }
      );

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(original);
      expect(scope.setTag).toHaveBeenCalledWith('graphql.path', 'posts.0.user');
      expect(scope.setTag).toHaveBeenCalledWith('source', 'subscription');
    });

    it('the Apollo plugin reports the unexpected errors of a request', async () => {
      const plugin = createErrorTrackingPlugin();
      const listener = await plugin.requestDidStart?.({} as never);
      const original = new Error('database went away');

      await listener?.didEncounterErrors?.({
        operationName: 'getPost',
        errors: [
          located(original),
          new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } }),
        ],
      } as never);

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(original);
      expect(scope.setTag).toHaveBeenCalledWith('operation', 'getPost');
    });
  });

  describe('Apollo server', () => {
    const schema = makeExecutableSchema({
      typeDefs: 'type Query { broken: String, refused: String, fine: String }',
      resolvers: {
        Query: {
          broken: () => {
            throw new TypeError('Cannot read properties of undefined');
          },
          refused: () => {
            throw new GraphQLError('Not allowed', { extensions: { code: 'FORBIDDEN' } });
          },
          fine: () => 'ok',
        },
      },
    });

    it('reports a resolver crash and not a refusal, without changing the response', async () => {
      initErrorTracking({ dsn: DSN });
      const server = createApolloServer(schema, http.createServer());
      await server.start();

      const response = await server.executeOperation({
        query: 'query Mixed { broken refused fine }',
      });
      await server.stop();

      expect(response.body.kind).toBe('single');
      const result = response.body.kind === 'single' ? response.body.singleResult : undefined;
      expect(result?.data).toEqual({ broken: null, refused: null, fine: 'ok' });
      expect(result?.errors?.map((error) => error.extensions?.code)).toEqual([
        'INTERNAL_SERVER_ERROR',
        'FORBIDDEN',
      ]);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(TypeError));
      expect(scope.setTag).toHaveBeenCalledWith('operation', 'Mixed');
      expect(scope.setTag).toHaveBeenCalledWith('graphql.path', 'broken');
    });

    it('sends nothing when error tracking is off', async () => {
      const server = createApolloServer(schema, http.createServer());
      await server.start();
      await server.executeOperation({ query: '{ broken }' });
      await server.stop();

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});

import type { Server as HttpServer } from 'http';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import {
  GraphQLError,
  getOperationAST,
  parse,
  validate,
  type DocumentNode,
  type GraphQLSchema,
} from 'graphql';
// Type-only: the runtime import goes through `exports`, which this tsconfig's
// node module resolution can't read, so the declarations are named directly.
import type { useServer as UseServer } from 'graphql-ws/dist/use/ws';
import { createWsContext, tokenFromConnectionParams } from './context';
import { watchSession } from './data/utils/wsSession';
import { requireAuth } from './data/utils/requireAuth';
import type { WsGraphQLContext } from './types/graphql';
import { reportError, reportGraphQLErrors } from '~/lib/errorTracking';

const requireGraphqlWs = createRequire(__filename);
const { useServer } = requireGraphqlWs('graphql-ws/use/ws') as { useServer: typeof UseServer };

export interface SubscriptionServer {
  wsServer: WebSocketServer;
  dispose: () => Promise<void>;
}

export interface SubscriptionServerOptions {
  schema: GraphQLSchema;
  contextFactory?: (
    connectionParams: Record<string, unknown> | undefined
  ) => Promise<WsGraphQLContext>;
}

export function createSubscriptionServer(
  httpServer: HttpServer,
  options: SubscriptionServerOptions
): SubscriptionServer {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const disposable = useServer(
    {
      // Builds the execution args here so every operation passes the same checks as HTTP
      // before it runs (#586). Returning errors refuses the operation and keeps the socket open.
      onSubscribe: async (ctx, _id, payload) => {
        let document: DocumentNode;
        try {
          document = parse(payload.query);
        } catch (error) {
          return [
            error instanceof GraphQLError ? error : new GraphQLError('Invalid GraphQL document'),
          ];
        }

        const validationErrors = validate(options.schema, document);
        if (validationErrors.length > 0) return [...validationErrors];

        const operation = getOperationAST(document, payload.operationName);
        if (!operation) return [new GraphQLError('Unable to identify operation')];

        // Queries and mutations go over HTTP, where the login check runs on the request.
        if (operation.operation !== 'subscription') {
          return [
            new GraphQLError('Only subscriptions are accepted over WebSocket', {
              extensions: { code: 'BAD_REQUEST' },
            }),
          ];
        }

        const connectionParams = ctx.connectionParams ?? undefined;
        let contextValue: WsGraphQLContext;
        try {
          contextValue = options.contextFactory
            ? await options.contextFactory(connectionParams)
            : await createWsContext(connectionParams);
        } catch (error) {
          reportError(error, { source: 'subscription', operationName: operation.name?.value });
          throw error;
        }

        if (!contextValue.user && requireAuth(payload.query)) {
          return [
            new GraphQLError('Auth token not found in request', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ];
        }

        // A disabled account gets no live updates (#793), and a signed-in connection is
        // closed when its token expires or the account stops being usable.
        if (contextValue.user) {
          if (contextValue.user.accountStatus === 'disabled') {
            return [
              new GraphQLError('This account is disabled', {
                extensions: { code: 'FORBIDDEN' },
              }),
            ];
          }
          const token = tokenFromConnectionParams(connectionParams);
          const userId = contextValue.userId ?? contextValue.user._id?.toString();
          if (token && userId) {
            const prisma = contextValue.prisma;
            watchSession(ctx.extra.socket, {
              token,
              userId,
              accountStillActive: async (id) => {
                const account = await prisma.user.findUnique({
                  where: { id },
                  select: { accountStatus: true },
                });
                return account !== null && account.accountStatus !== 'disabled';
              },
            });
          }
        }

        return {
          schema: options.schema,
          document,
          operationName: payload.operationName,
          variableValues: payload.variables,
          contextValue,
        };
      },
      // Unexpected errors are reported (#183). Refusals from onSubscribe carry a code or no
      // original error, so they aren't. Returning nothing keeps what the client receives.
      onError: (_ctx, _id, payload, errors) => {
        reportGraphQLErrors(errors, {
          source: 'subscription',
          operationName: payload.operationName ?? undefined,
        });
      },
      onNext: (_ctx, _id, payload, _args, result) => {
        if (result.errors) {
          reportGraphQLErrors(result.errors, {
            source: 'subscription',
            operationName: payload.operationName ?? undefined,
          });
        }
      },
    },
    wsServer
  );

  return {
    wsServer,
    dispose: async () => {
      await disposable.dispose();
      await new Promise<void>((resolve, reject) => {
        wsServer.close((error) => {
          if (!error || error.message === 'The server is not running') {
            resolve();
            return;
          }
          reject(error);
        });
      });
    },
  };
}

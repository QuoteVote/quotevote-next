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
import { createWsContext } from './context';
import { requireAuth } from './data/utils/requireAuth';
import type { WsGraphQLContext } from './types/graphql';

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
        const contextValue = options.contextFactory
          ? await options.contextFactory(connectionParams)
          : await createWsContext(connectionParams);

        if (!contextValue.user && requireAuth(payload.query)) {
          return [
            new GraphQLError('Auth token not found in request', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ];
        }

        return {
          schema: options.schema,
          document,
          operationName: payload.operationName,
          variableValues: payload.variables,
          contextValue,
        };
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

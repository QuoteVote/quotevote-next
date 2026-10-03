import type { Server as HttpServer } from 'http';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import type { GraphQLSchema } from 'graphql';
import { createWsContext } from './context';
import type { WsGraphQLContext } from './types/graphql';

const requireGraphqlWs = createRequire(__filename);
const { useServer } = requireGraphqlWs('graphql-ws/use/ws') as {
  useServer: (
    options: Record<string, unknown>,
    wsServer: WebSocketServer
  ) => {
    dispose: () => Promise<void>;
  };
};

export interface SubscriptionServer {
  wsServer: WebSocketServer;
  dispose: () => Promise<void>;
}

export interface SubscriptionServerOptions {
  schema?: GraphQLSchema;
  contextFactory?: (
    connectionParams: Record<string, unknown> | undefined
  ) => Promise<WsGraphQLContext>;
}

export function createSubscriptionServer(
  httpServer: HttpServer,
  options: SubscriptionServerOptions = {}
): SubscriptionServer {
  const executableSchema =
    options.schema ?? (requireGraphqlWs('./data/schema') as { schema: GraphQLSchema }).schema;
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const disposable = useServer(
    {
      schema: executableSchema,
      context: async (ctx) =>
        options.contextFactory
          ? options.contextFactory(ctx.connectionParams as Record<string, unknown> | undefined)
          : createWsContext(ctx.connectionParams as Record<string, unknown> | undefined),
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

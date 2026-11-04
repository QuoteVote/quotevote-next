import type { Server as HttpServer } from 'http';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import type { GraphQLSchema } from 'graphql';
// Type-only: the runtime import goes through `exports`, which this tsconfig's
// node module resolution can't read, so the declarations are named directly.
import type { useServer as UseServer } from 'graphql-ws/dist/use/ws';
import { createWsContext } from './context';
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
      schema: options.schema,
      context: async (ctx): Promise<WsGraphQLContext> => {
        const connectionParams = ctx.connectionParams ?? undefined;
        return options.contextFactory
          ? options.contextFactory(connectionParams)
          : createWsContext(connectionParams);
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

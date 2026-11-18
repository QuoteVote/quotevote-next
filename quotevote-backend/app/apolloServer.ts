import type http from 'http';
import type { GraphQLSchema } from 'graphql';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import type { GraphQLContext } from '~/types/graphql';
import { createErrorTrackingPlugin } from '~/lib/errorTracking';

/**
 * Builds the Apollo Server used for HTTP GraphQL requests.
 *
 * @param schema - Executable GraphQL schema
 * @param httpServer - HTTP server to drain on stop()
 * @returns Configured Apollo Server (not yet started)
 */
export function createApolloServer(
  schema: GraphQLSchema,
  httpServer: http.Server
): ApolloServer<GraphQLContext> {
  return new ApolloServer<GraphQLContext>({
    schema,
    // stop() closes the HTTP server and waits for in-flight requests.
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Reports unexpected errors when SENTRY_DSN is set (#183).
      createErrorTrackingPlugin<GraphQLContext>(),
    ],
    // Signals are handled in server.ts. Apollo's own handler also called stop() and kept the
    // process alive after SIGTERM.
    stopOnTerminationSignals: false,
    // A hash-only request carries no query text, so createHttpContext can't apply the login
    // check to it (#586). The frontend doesn't send persisted queries.
    persistedQueries: false,
  });
}

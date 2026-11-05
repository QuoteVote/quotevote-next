import express from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { schema } from './data/schema';
import type { GraphQLContext } from './types/graphql';
import { createHttpContext } from './context';
import { disconnectPrisma, prisma } from './lib/prisma';
import { startPresenceCleanup } from './data/utils/presence/cleanupStalePresence';
import * as auth from './data/utils/authentication';
import { parseTrustProxy } from './data/utils/trustProxy';
import { createSubscriptionServer } from './subscriptions';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Environment Variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quotevote';
// Exit anyway if shutdown hangs, so the platform can restart the container.
const SHUTDOWN_TIMEOUT_MS = 10000;

async function startServer() {
  // 1. Database Connection (Mongoose v9)
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }

  // Start Presence Cleanup Job
  startPresenceCleanup(prisma);

  // 2. Apollo Server Setup (v4/v5 Syntax)
  const server = new ApolloServer<GraphQLContext>({
    schema,
    // stop() closes the HTTP server and waits for in-flight requests.
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    // Signals are handled below. Apollo's own handler also called stop() and kept the
    // process alive after SIGTERM.
    stopOnTerminationSignals: false,
  });

  await server.start();
  const subscriptionServer = createSubscriptionServer(httpServer, { schema });

  // 3. Middleware & Routes Integration
  // Behind the hosting platform's proxy, set TRUST_PROXY=1 so req.ip is the
  // visitor's address instead of the proxy's.
  const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
  if (trustProxy) app.set('trust proxy', trustProxy);

  app.use(
    cors<cors.CorsRequest>({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check for the hosting platform: 200 while the database is connected and the
  // server isn't shutting down, 503 otherwise.
  let shuttingDown = false;
  app.get('/health', (_req, res) => {
    const healthy = !shuttingDown && mongoose.connection.readyState === 1;
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable' });
  });

  // Auth Routes — guest registration removed (#573); /auth/register always refuses (#665)
  app.post('/auth/register', auth.register);
  app.post('/auth/login', auth.login);
  app.post('/auth/refresh', auth.refresh);

  // GraphQL Integration — context created via shared factory
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => createHttpContext({ req, res }),
    })
  );

  // 4. Start Server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);

  // 5. Graceful Shutdown
  // Guard flag prevents the handler from running twice when the process
  // receives both SIGINT and SIGTERM (common with container orchestrators).
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('🔄 Shutting down gracefully...');

    setTimeout(() => {
      console.error(`Shutdown took longer than ${SHUTDOWN_TIMEOUT_MS} ms, exiting`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    await subscriptionServer.dispose();

    // Stop accepting new connections and drain in-flight requests
    try {
      await server.stop();
    } catch (err) {
      console.error('Error stopping Apollo Server:', err);
    }

    // Disconnect database clients in parallel — allSettled ensures one
    // failure does not prevent the other from disconnecting.
    await Promise.allSettled([disconnectPrisma(), mongoose.disconnect()]);

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();

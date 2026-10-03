import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { schema } from './data/schema';
import type { GraphQLContext } from './types/graphql';
import { createHttpContext } from './context';
import { disconnectPrisma } from './lib/prisma';
import { startPresenceCleanup } from './data/utils/presence/cleanupStalePresence';
import * as auth from './data/utils/authentication';
import { createSubscriptionServer } from './subscriptions';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Environment Variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quotevote';

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
  startPresenceCleanup();

  // 2. Apollo Server Setup (v4/v5 Syntax)
  const server = new ApolloServer<GraphQLContext>({
    schema,
  });

  await server.start();
  const subscriptionServer = createSubscriptionServer(httpServer);

  // 3. Middleware & Routes Integration
  app.use(
    cors<cors.CorsRequest>({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());

  // Auth Routes
  app.post('/auth/register', auth.register);
  app.post('/auth/login', auth.login);
  app.post('/auth/refresh', auth.refresh);
  app.post('/auth/guest', auth.createGuestUser);

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
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('🔄 Shutting down gracefully...');

    // Stop accepting new connections and drain in-flight requests
    try {
      await server.stop();
    } catch (err) {
      console.error('Error stopping Apollo Server:', err);
    }

    await subscriptionServer.dispose();
    httpServer.close();

    // Disconnect database clients in parallel — allSettled ensures one
    // failure does not prevent the other from disconnecting.
    await Promise.allSettled([disconnectPrisma(), mongoose.disconnect()]);

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();

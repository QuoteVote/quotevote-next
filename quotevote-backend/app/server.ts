import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { solidResolvers } from './data/resolvers/solidResolvers';
import type { GraphQLContext } from './types/graphql';
import User from './data/models/User';
import * as auth from './data/utils/authentication';

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

  // 2. Apollo Server Setup (v4/v5 Syntax)
  const server = new ApolloServer<GraphQLContext>({
    typeDefs: `
      type Query {
        hello: String
        status: String
        solidConnectionStatus: SolidConnectionStatus
      }

      type Mutation {
        solidStartConnect(issuer: String!): SolidStartConnectResponse
        solidFinishConnect(code: String!, state: String!, redirectUri: String!): SolidConnectionResponse
        solidDisconnect: Boolean
        solidPullPortableState: String
        solidPushPortableState(input: PortableStateInput!): Boolean
        solidAppendActivityEvent(input: ActivityEventInput!): Boolean
      }

      type SolidConnectionStatus {
        connected: Boolean
        webId: String
        issuer: String
        lastSyncAt: String
      }

      type SolidStartConnectResponse {
        authorizationUrl: String
      }

      type SolidConnectionResponse {
        success: Boolean
        webId: String
        issuer: String
        message: String
      }

      input PortableStateInput {
        content: String
      }

      input ActivityEventInput {
        type: String
        payload: String
      }
    `,
    resolvers: [
      {
        Query: {
          hello: () => 'Hello from TypeScript Backend! 🚀',
          status: () => 'Active',
        },
      },
      solidResolvers
    ],
  });

  await server.start();

  // 3. Middleware & Routes Integration
  app.use(cors<cors.CorsRequest>());
  app.use(express.json());

  // Auth Routes
  app.post('/auth/register', auth.register);
  app.post('/auth/login', auth.login);
  app.post('/auth/refresh', auth.refresh);
  app.post('/auth/guest', auth.createGuestUser);

  // GraphQL Integration
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<GraphQLContext> => {
        const token = req.headers.authorization?.split(' ')[1];
        let user = null;

        if (token) {
          try {
            const decoded = await auth.verifyToken(token);
            if (decoded && typeof decoded === 'object' && decoded.userId) {
              user = (await User.findById(decoded.userId)) as typeof User.prototype;
            }
          } catch {
            // Token invalid or expired, proceed as unauthenticated
          }
        }

        return {
          req,
          res,
          user,
          pubsub: null as any, // Placeholder until real PubSub is added
        };
      },
    })
  );

  // 4. Start Server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startServer();

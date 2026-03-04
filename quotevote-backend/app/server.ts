import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { solidResolvers } from './data/resolvers/solidResolvers';
import type { GraphQLContext, PubSub } from './types/graphql';
import { requireAuth } from './data/utils/requireAuth';
import { pubsub } from './data/utils/pubsub';
import { startPresenceCleanup } from './data/utils/presence/cleanupStalePresence';
import * as auth from './data/utils/authentication';
import User from './data/models/User';
import UserInvite from './data/models/UserInvite';
import sendGridEmail, { SENDGRID_TEMPLATE_IDS } from './data/utils/send-grid-mail';
import { logger } from './data/utils/logger';
import type * as Common from './types/common';

// Use shared pubsub instance referencing the import
const noOpPubSub: PubSub = pubsub;

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
    typeDefs: `
      type Query {
        hello: String
        status: String
        solidConnectionStatus: SolidConnectionStatus
        checkEmailStatus(email: String!): EmailStatusResult!
      }

      type Mutation {
          requestUserAccess(requestUserAccessInput: RequestUserAccessInput!): UserInviteResult
          solidStartConnect(issuer: String!): SolidConnectResult
          solidFinishConnect(code: String!, state: String!, redirectUri: String!): SolidConnectResult
          solidDisconnect: Boolean
          solidPullPortableState: PortableState
          solidPushPortableState(input: PortableStateInput!): Boolean
          solidAppendActivityEvent(input: ActivityEventInput!): Boolean
          sendMagicLink(email: String!): Boolean
      }

      input RequestUserAccessInput {
        email: String!
        name: String
        message: String
      }

      type UserInviteResult {
        _id: String
        email: String
      }

      type EmailStatusResult {
        status: String!
      }

      type SolidConnectionStatus {
        connected: Boolean
        webId: String
        issuer: String
        lastSyncAt: String
      }

      type SolidConnectResult {
          authorizationUrl: String
          success: Boolean
          webId: String
          issuer: String
          message: String
      }
      
      scalar JSON

      type PortableState {
          version: String
          collections: [JSON]
      }

      input PortableStateInput {
          version: String
          collections: [JSON]
      }
      
      input ActivityEventInput {
          type: String!
          payload: JSON!
          timestamp: String
      }
    `,
    resolvers: [
      {
        Query: {
          hello: () => 'Hello from TypeScript Backend! 🚀',
          status: () => 'Active',
          checkEmailStatus: async (_parent: unknown, args: { email: string }) => {
            const email = args.email.toLowerCase().trim();

            // Check if user exists with a password
            const user = await User.findOne({ email });
            if (user && user.password) {
              return { status: 'registered' };
            }

            // Check invite status
            const invite = await UserInvite.findOne({ email });
            if (!invite) {
              return { status: 'not_requested' };
            }

            if (invite.status === 'pending') {
              return { status: 'requested_pending' };
            }

            if (invite.status === 'accepted') {
              return { status: 'approved_no_password' };
            }

            return { status: 'not_requested' };
          },
        },
        Mutation: {
          requestUserAccess: async (_parent: unknown, args: { requestUserAccessInput: { email: string; name?: string; message?: string } }) => {
            const { email, name, message } = args.requestUserAccessInput;
            const normalizedEmail = email.toLowerCase().trim();

            // Check if invite already exists
            const existing = await UserInvite.findOne({ email: normalizedEmail });
            if (existing) {
              return { _id: existing._id.toString(), email: existing.email };
            }

            const invite = await UserInvite.create({
              email: normalizedEmail,
              status: 'pending',
            });

            logger.info('User access requested', { email: normalizedEmail, name, message });
            return { _id: invite._id.toString(), email: invite.email };
          },
          sendMagicLink: async (_parent: unknown, args: { email: string }) => {
            const email = args.email.toLowerCase().trim();
            const user = await User.findOne({ email });

            if (!user) {
              logger.warn('sendMagicLink called for non-existent user', { email });
              // Return true to avoid leaking user existence
              return true;
            }

            const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_do_not_use_in_prod';
            const token = jwt.sign(
              { userId: user._id.toString(), email, purpose: 'magic_link' },
              jwtSecret,
              { expiresIn: '15m' }
            );

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const magicLinkUrl = `${frontendUrl}/auth/magic-link?token=${token}`;

            await sendGridEmail({
              to: email,
              templateId: SENDGRID_TEMPLATE_IDS.MAGIC_LOGIN_LINK,
              dynamicTemplateData: {
                magicLinkUrl,
                userName: user.name || user.username,
              },
            });

            logger.info('Magic link sent', { email });
            return true;
          },
        },
      },
      solidResolvers
    ],
  });

  await server.start();

  // 3. Middleware & Routes Integration
  app.use(cors<cors.CorsRequest>({
    origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }));
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

        // Check if this is an introspection query (GraphQL Playground/IDE)
        const isIntrospection = req.body?.operationName === 'IntrospectionQuery';

        if (token) {
          try {
            const decoded = await auth.verifyToken(token);
            if (decoded && typeof decoded === 'object' && decoded.userId) {
              user = (await User.findById(decoded.userId)) as unknown as Common.User;
            }
          } catch {
            // Token invalid or expired, proceed as unauthenticated
          }
        }

        // Check if query requires authentication (skip for introspection)
        if (!isIntrospection) {
          const query = req.body?.query;
          if (query && requireAuth(query) && !user) {
            throw new GraphQLError('Auth token not found in request', {
              extensions: { code: 'UNAUTHENTICATED' },
            });
          }
        }

        return {
          req,
          res,
          user,
          pubsub: noOpPubSub,
        };
      },
    })
  );

  // 4. Start Server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startServer();

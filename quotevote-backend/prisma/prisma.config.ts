import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema'),
  migrate: {
    adapter: async () => {
      const { PrismaMongoDB } = await import('@prisma/adapter-mongodb');
      const { MongoClient } = await import('mongodb');

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      const client = new MongoClient(connectionString);
      await client.connect();

      return new PrismaMongoDB(client);
    },
  },
});

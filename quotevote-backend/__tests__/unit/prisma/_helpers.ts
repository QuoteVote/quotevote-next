/**
 * Shared helpers for Prisma mock-based CRUD tests
 */

export function createMockPrismaModel() {
  return {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  };
}

export type MockPrismaModel = ReturnType<typeof createMockPrismaModel>;

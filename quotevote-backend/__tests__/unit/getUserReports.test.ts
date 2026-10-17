import { graphql } from 'graphql';
import { schema } from '~/data/schema';

const targetUserId = '60d5ec49ad414d7a8d5464b1';

const source = `
  query {
    reports: getUserReports(userId: "${targetUserId}") {
      ...ReportFields
    }
  }
  fragment ReportFields on UserReport {
    _id
    reason
  }
`;

type TestUser = { _id: string; admin: boolean };

function buildContext(user: TestUser | null) {
  const findMany = jest.fn().mockResolvedValue([]);
  return {
    findMany,
    contextValue: {
      user,
      userId: user?._id ?? null,
      prisma: { userReport: { findMany } },
    },
  };
}

type RejectedCase = { label: string; user: TestUser | null; code: string };

const rejectedCases: RejectedCase[] = [
  { label: 'a signed-out caller', user: null, code: 'UNAUTHENTICATED' },
  { label: 'a non-admin member', user: { _id: 'member-1', admin: false }, code: 'FORBIDDEN' },
];

describe('getUserReports authorization (executable schema)', () => {
  it.each(rejectedCases)('rejects $label without reading reports', async ({ user, code }) => {
    const { findMany, contextValue } = buildContext(user);

    const result = await graphql({ schema, source, contextValue });

    expect(result.errors?.[0].extensions?.code).toBe(code);
    expect(result.data).toEqual({ reports: null });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('lets an admin read reports through the intended query', async () => {
    const { findMany, contextValue } = buildContext({ _id: 'admin-1', admin: true });

    const result = await graphql({ schema, source, contextValue });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ reports: [] });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reportedUserId: targetUserId }, take: 100 })
    );
  });
});

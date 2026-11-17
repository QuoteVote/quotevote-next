import { GraphQLError } from 'graphql';
import { hasRole, requireRole } from '~/data/utils/requireRole';
import type * as Common from '~/types/common';

const member = (roles: Partial<Common.User> = {}): Common.User =>
  ({ _id: 'user-1', username: 'someone', email: 'someone@example.com', ...roles }) as Common.User;

const ROLES: Common.StaffRole[] = ['admin', 'moderator', 'inviteApprover'];

async function expectError(fn: () => unknown, code: string, message: string): Promise<void> {
  let thrown: unknown;
  try {
    fn();
  } catch (err) {
    thrown = err;
  }
  expect(thrown).toBeInstanceOf(GraphQLError);
  expect((thrown as GraphQLError).extensions.code).toBe(code);
  expect((thrown as GraphQLError).message).toBe(message);
}

describe('staff roles (#616)', () => {
  describe('hasRole', () => {
    it('lets an admin act as every role', () => {
      ROLES.forEach((role) => expect(hasRole(member({ admin: true }), role)).toBe(true));
    });

    it('gives a moderator only the moderator role', () => {
      const moderator = member({ isModerator: true });
      expect(hasRole(moderator, 'moderator')).toBe(true);
      expect(hasRole(moderator, 'inviteApprover')).toBe(false);
      expect(hasRole(moderator, 'admin')).toBe(false);
    });

    it('gives an invite approver only the invite approver role', () => {
      const approver = member({ isInviteApprover: true });
      expect(hasRole(approver, 'inviteApprover')).toBe(true);
      expect(hasRole(approver, 'moderator')).toBe(false);
      expect(hasRole(approver, 'admin')).toBe(false);
    });

    it('lets one user hold several roles', () => {
      const both = member({ isModerator: true, isInviteApprover: true });
      expect(hasRole(both, 'moderator')).toBe(true);
      expect(hasRole(both, 'inviteApprover')).toBe(true);
      expect(hasRole(both, 'admin')).toBe(false);
    });

    it('gives a member, a missing flag or no user no role', () => {
      ROLES.forEach((role) => {
        expect(hasRole(member(), role)).toBe(false);
        expect(hasRole(member({ admin: false, isModerator: false }), role)).toBe(false);
        expect(hasRole(null, role)).toBe(false);
        expect(hasRole(undefined, role)).toBe(false);
      });
    });
  });

  describe('requireRole', () => {
    it('returns the caller id when the role is held', () => {
      expect(requireRole({ user: member({ isModerator: true }) }, 'moderator')).toBe('user-1');
      expect(requireRole({ user: member({ admin: true }) }, 'inviteApprover')).toBe('user-1');
    });

    it('refuses a signed-out caller as UNAUTHENTICATED', async () => {
      await expectError(
        () => requireRole({ user: null }, 'moderator'),
        'UNAUTHENTICATED',
        'Authentication required'
      );
    });

    it('refuses a caller without the role as FORBIDDEN, naming the role', async () => {
      await expectError(
        () => requireRole({ user: member() }, 'admin'),
        'FORBIDDEN',
        'Admin access required'
      );
      await expectError(
        () => requireRole({ user: member({ isInviteApprover: true }) }, 'moderator'),
        'FORBIDDEN',
        'Moderator access required'
      );
      await expectError(
        () => requireRole({ user: member({ isModerator: true }) }, 'inviteApprover'),
        'FORBIDDEN',
        'Invite approver access required'
      );
    });
  });
});

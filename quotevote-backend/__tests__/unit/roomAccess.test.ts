import { assertRoomAccess } from '~/data/utils/roomAccess';
import { RoomAccessDeniedError, RoomNotFoundError } from '~/types/roomAccess';

describe('assertRoomAccess', () => {
  const userId = 'user-1';

  it('rejects a nonexistent room', () => {
    expect(() => assertRoomAccess(null, userId)).toThrow(RoomNotFoundError);
  });

  it('allows a member of a USER room', () => {
    expect(() =>
      assertRoomAccess({ messageType: 'USER', userIds: [userId, 'user-2'] }, userId)
    ).not.toThrow();
  });

  it('rejects a non-member of a USER room', () => {
    expect(() =>
      assertRoomAccess({ messageType: 'USER', userIds: ['user-2'] }, userId)
    ).toThrow(RoomAccessDeniedError);
  });

  it('allows a member of a SYSTEM room', () => {
    expect(() =>
      assertRoomAccess({ messageType: 'SYSTEM', userIds: [userId] }, userId)
    ).not.toThrow();
  });

  it('rejects a non-member of a SYSTEM room', () => {
    expect(() =>
      assertRoomAccess({ messageType: 'SYSTEM', userIds: ['user-2'] }, userId)
    ).toThrow(RoomAccessDeniedError);
  });

  it('allows any authenticated user on a POST room', () => {
    expect(() => assertRoomAccess({ messageType: 'POST', userIds: [] }, userId)).not.toThrow();
  });
});
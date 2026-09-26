import type { RoomAccessInput } from '~/types/roomAccess';
import { RoomAccessDeniedError, RoomNotFoundError } from '~/types/roomAccess';

export function assertRoomAccess(room: RoomAccessInput | null, userId: string): void {
  if (!room) {
    throw new RoomNotFoundError();
  }

  if (room.messageType === 'POST') {
    return;
  }

  if (!room.userIds.includes(userId)) {
    throw new RoomAccessDeniedError();
  }
}
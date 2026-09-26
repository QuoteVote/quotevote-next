export type RoomType = 'USER' | 'POST' | 'SYSTEM';

export interface RoomAccessInput {
  messageType: RoomType;
  userIds: string[];
}

export class RoomNotFoundError extends Error {
  constructor() {
    super('Room not found');
  }
}

export class RoomAccessDeniedError extends Error {
  constructor() {
    super('Not a member of this room');
  }
}
import type { RoomErrorCode } from '@chess/shared';

/** Expected business errors are safe to display to a player. */
export class RoomError extends Error {
  constructor(
    message: string,
    readonly code?: RoomErrorCode,
  ) {
    super(message);
  }
}

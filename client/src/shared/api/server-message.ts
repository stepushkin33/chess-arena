import type { RoomView, ServerMessage } from '@chess/shared';

const events = new Set([
  'connected',
  'room_created',
  'room_joined',
  'room_state',
  'game_state',
  'error',
  'room_left',
  'opponent_left',
  'draw_declined',
  'rematch_declined',
]);

/** JSON has no TypeScript types; validate the envelope at the network boundary. */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const value = JSON.parse(raw) as { event?: string; data?: unknown };
    if (!value || !events.has(value.event ?? '') || !value.data || typeof value.data !== 'object')
      return null;
    if (['room_created', 'room_joined', 'room_state', 'game_state'].includes(value.event!)) {
      const room = value.data as Partial<RoomView>;
      if (typeof room.roomId !== 'string' || !room.you || !Array.isArray(room.state?.board))
        return null;
    }
    return value as ServerMessage;
  } catch {
    return null;
  }
}

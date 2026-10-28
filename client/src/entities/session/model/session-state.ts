import type { RoomView, ServerMessage } from '@chess/shared';

export interface SessionState {
  room: RoomView | null;
  invitation: string | null;
  accessError: 'full' | 'not-found' | null;
  notice: string;
}
export type SessionEvent =
  ServerMessage | { event: 'navigate'; roomId: string | null } | { event: 'send_failed' };

export const initialSession = (invitation: string | null): SessionState => ({
  room: null,
  invitation,
  accessError: null,
  notice: '',
});

/** All incoming session transitions are explicit and testable without React or a socket. */
export function sessionReducer(state: SessionState, message: SessionEvent): SessionState {
  switch (message.event) {
    case 'navigate':
      return initialSession(message.roomId);
    case 'room_created':
    case 'room_joined':
      return { ...state, room: message.data, accessError: null, notice: '' };
    case 'room_state':
    case 'game_state':
      return state.room?.roomId === message.data.roomId
        ? { ...state, room: message.data, notice: '' }
        : state;
    case 'error': {
      if (message.data.code === 'ROOM_FULL') return { ...state, room: null, accessError: 'full' };
      if (message.data.code === 'ROOM_NOT_FOUND')
        return { ...state, room: null, accessError: 'not-found' };
      return { ...state, notice: message.data.message };
    }
    case 'opponent_left':
      return { ...state, notice: 'Соперник покинул комнату.' };
    case 'draw_declined':
      return { ...state, notice: 'Соперник отказался от ничьей.' };
    case 'rematch_declined':
      return { ...state, notice: 'Соперник отказался от новой партии.' };
    case 'send_failed':
      return { ...state, notice: 'Нет соединения. Попробуйте ещё раз.' };
    default:
      return state;
  }
}

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { ClientCommand, ServerMessage } from '@chess/shared';
import { useGameSocket } from '../../../shared/api/useGameSocket';
import { playerId } from '../../../shared/lib/player-storage';
import { navigateToLobby, navigateToRoom, readRoomRoute } from '../../../shared/lib/room-route';
import { initialSession, sessionReducer } from './session-state';

export function useSessionConnection() {
  const [state, dispatch] = useReducer(sessionReducer, readRoomRoute(), initialSession);
  const roomRef = useRef(state.room);
  roomRef.current = state.room;
  const receive = useCallback((message: ServerMessage) => {
    if (message.event === 'room_created' || message.event === 'room_joined')
      navigateToRoom(message.data.roomId);
    dispatch(message);
  }, []);
  const socket = useGameSocket(receive, (reconnectSend) => {
    const room = roomRef.current;
    if (room)
      reconnectSend({
        event: 'join_room',
        data: { roomId: room.roomId, name: room.you.name, playerId: playerId() },
      });
  });
  const sendFrame = socket.send;
  const send = useCallback(
    (command: ClientCommand): boolean => {
      const sent = sendFrame(command);
      if (!sent) dispatch({ event: 'send_failed' });
      return sent;
    },
    [sendFrame],
  );
  const leave = useCallback(() => {
    if (roomRef.current) sendFrame({ event: 'leave_room' });
    roomRef.current = null;
    dispatch({ event: 'navigate', roomId: null });
    navigateToLobby();
  }, [sendFrame]);

  useEffect(() => {
    const followRoute = (): void => {
      const roomId = readRoomRoute();
      if (roomRef.current?.roomId === roomId) return;
      if (roomRef.current) sendFrame({ event: 'leave_room' });
      roomRef.current = null;
      dispatch({ event: 'navigate', roomId });
    };
    window.addEventListener('popstate', followRoute);
    return () => window.removeEventListener('popstate', followRoute);
  }, [sendFrame]);
  return { state, connected: socket.ready, send, leave };
}

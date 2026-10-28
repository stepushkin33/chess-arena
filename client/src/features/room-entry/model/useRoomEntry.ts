import { useEffect, useState } from 'react';
import {
  useSessionActions,
  useSessionState,
} from '../../../entities/session/model/SessionProvider';
import { playerId, saveName, storedName } from '../../../shared/lib/player-storage';

type EntryRequest = { kind: 'create' } | { kind: 'join'; roomId: string };

export function useRoomEntry() {
  const { invitation, connected } = useSessionState();
  const { send, leave } = useSessionActions();
  const [name, setName] = useState(storedName);
  const [roomCode, setRoomCode] = useState(invitation ?? '');
  const [request, setRequest] = useState<EntryRequest | null>(
    invitation ? { kind: 'join', roomId: invitation } : null,
  );
  const [askingName, setAskingName] = useState(Boolean(invitation));

  useEffect(() => {
    if (!invitation) return;
    setRoomCode(invitation);
    setRequest({ kind: 'join', roomId: invitation });
    setAskingName(true);
  }, [invitation]);
  useEffect(() => {
    if (!connected || askingName || !request) return;
    const identity = { name, playerId: playerId() };
    if (request.kind === 'create') send({ event: 'create_room', data: identity });
    else send({ event: 'join_room', data: { ...identity, roomId: request.roomId } });
    setRequest(null);
  }, [askingName, connected, name, request, send]);

  return {
    name,
    roomCode,
    setRoomCode,
    askingName,
    creating: request?.kind === 'create',
    create: () => {
      setRequest({ kind: 'create' });
      setAskingName(true);
    },
    join: () => {
      setRequest({ kind: 'join', roomId: roomCode });
      setAskingName(true);
    },
    confirmName: (value: string) => {
      saveName(value);
      setName(value);
      setAskingName(false);
    },
    cancel: () => {
      setRequest(null);
      setAskingName(false);
      if (invitation) leave();
    },
  };
}

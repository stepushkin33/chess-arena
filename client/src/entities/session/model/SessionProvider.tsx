import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import type { RoomView } from '@chess/shared';
import type { SendCommand } from '../../../shared/api/useGameSocket';
import { useSessionConnection } from './useSessionConnection';
import type { SessionState } from './session-state';

interface SessionSnapshot extends SessionState {
  connected: boolean;
}
interface SessionActions {
  send: SendCommand;
  leave: () => void;
}
const StateContext = createContext<SessionSnapshot | null>(null);
const ActionsContext = createContext<SessionActions | null>(null);

/** Shared here: the room and connection. Board selection and dialogs stay local to features. */
export function SessionProvider({ children }: PropsWithChildren): JSX.Element {
  const { state, connected, send, leave } = useSessionConnection();
  const snapshot = useMemo(() => ({ ...state, connected }), [state, connected]);
  const actions = useMemo(() => ({ send, leave }), [send, leave]);
  return (
    <StateContext.Provider value={snapshot}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useSessionState(): SessionSnapshot {
  const value = useContext(StateContext);
  if (!value) throw new Error('SessionProvider is missing');
  return value;
}
export function useSessionActions(): SessionActions {
  const value = useContext(ActionsContext);
  if (!value) throw new Error('SessionProvider is missing');
  return value;
}
export function useActiveRoom(): RoomView {
  const { room } = useSessionState();
  if (!room) throw new Error('This component requires an active room');
  return room;
}

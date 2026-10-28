import { SessionProvider, useSessionState } from './entities/session/model/SessionProvider';
import { LobbyPage } from './pages/lobby/ui/LobbyPage';
import { RoomAccessPage } from './pages/room-access/ui/RoomAccessPage';
import { RoomPage } from './pages/room/ui/RoomPage';

function SessionRoutes(): JSX.Element {
  const { room, accessError } = useSessionState();
  if (accessError) return <RoomAccessPage />;
  return room ? <RoomPage /> : <LobbyPage />;
}

export function App(): JSX.Element {
  return (
    <SessionProvider>
      <SessionRoutes />
    </SessionProvider>
  );
}

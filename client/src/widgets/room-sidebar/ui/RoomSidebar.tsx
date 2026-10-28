import { useActiveRoom } from '../../../entities/session/model/SessionProvider';
import { SessionNotice } from '../../../entities/session/ui/ConnectionStatus';
import { GameActions } from '../../../features/game-actions/ui/GameActions';
import { RoomInvitation } from '../../../features/room-invite/ui/RoomInvitation';
import { GameHistory } from '../../../entities/game/ui/GameHistory';
import { GameStatus } from '../../../entities/session/ui/GameStatus';

export function RoomSidebar(): JSX.Element {
  const room = useActiveRoom();
  return (
    <aside className="game-sidebar">
      <GameStatus variant="card" />
      {room.playersCount < 2 && <RoomInvitation />}
      <div className="sidebar-card history-card">
        <div className="sidebar-title">
          <span>ИСТОРИЯ ХОДОВ</span>
          <span className="move-count">БЕЛЫЕ / ЧЁРНЫЕ</span>
        </div>
        <GameHistory moves={room.state.moveHistory} />
      </div>
      <GameActions />
      <SessionNotice />
    </aside>
  );
}

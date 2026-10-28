import { RoomHeader } from '../../../widgets/room-header/ui/RoomHeader';
import { GameBoardPanel } from '../../../widgets/game-board-panel/ui/GameBoardPanel';
import { RoomSidebar } from '../../../widgets/room-sidebar/ui/RoomSidebar';
import { TurnNotice } from '../../../widgets/turn-notice/ui/TurnNotice';

/** A page composes independent blocks; it does not orchestrate their internal state. */
export function RoomPage(): JSX.Element {
  return (
    <main className="app-shell game-shell">
      <RoomHeader />
      <section className="game-layout">
        <GameBoardPanel />
        <RoomSidebar />
      </section>
      <TurnNotice />
    </main>
  );
}

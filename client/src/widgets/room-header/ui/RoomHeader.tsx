import { useState } from 'react';
import { useActiveRoom, useSessionActions } from '../../../entities/session/model/SessionProvider';
import { ConnectionStatus } from '../../../entities/session/ui/ConnectionStatus';
import { useRoomInvite } from '../../../features/room-invite/model/useRoomInvite';
import { PieceHelpModal } from '../../../features/piece-help/ui/PieceHelpModal';

export function RoomHeader(): JSX.Element {
  const room = useActiveRoom();
  const { leave } = useSessionActions();
  const { copied, share } = useRoomInvite(room);
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <header className="topbar">
        <button className="wordmark" type="button" onClick={leave}>
          <span>♞</span>
          <span className="wordmark-name">CHESS ARENA</span>
        </button>
        <div className="topbar-room">
          <span>КОМНАТА</span>
          <strong>{room.roomId}</strong>
        </div>
        <div className="topbar-actions">
          <button className="exit-room-button" type="button" onClick={leave}>
            ← Выйти
          </button>
          <button onClick={share} className="copy-button invite-button" type="button">
            {copied ? 'Ссылка готова' : 'Пригласить соперника'} ↗
          </button>
          <button
            className="help-button"
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Подсказки по фигурам"
          >
            ?
          </button>
          <ConnectionStatus />
        </div>
      </header>
      <PieceHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

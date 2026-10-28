import { useActiveRoom } from '../model/SessionProvider';
import { describeRoom } from '../../game/lib/format';
import { isYourTurn } from '../../game/model/selectors';

export function TurnBanner(): JSX.Element {
  const room = useActiveRoom();
  const { label } = describeRoom(room);
  return (
    <div
      className={`turn-banner ${isYourTurn(room) && room.playersCount === 2 ? 'your-turn' : ''}`}
    >
      <span className="turn-icon">{room.state.status === 'playing' ? '◈' : '✦'}</span>
      {label}
    </div>
  );
}

export function GameStatus({ variant }: { variant: 'compact' | 'card' }): JSX.Element {
  const room = useActiveRoom();
  const { label, hint, finished } = describeRoom(room);
  const content = (
    <>
      <span className={`result-orb ${finished ? 'finished' : ''}`}>{finished ? '✦' : '♟'}</span>
      <div>
        <strong>{label}</strong>
        <small>{hint}</small>
      </div>
    </>
  );
  if (variant === 'compact') return <div className="mobile-game-status">{content}</div>;
  return (
    <div className="sidebar-card game-info-card">
      <div className="sidebar-title">
        <span>ПАРТИЯ</span>
        <span className="move-count">Ход {room.state.fullmoveNumber}</span>
      </div>
      <div className="game-result">{content}</div>
    </div>
  );
}

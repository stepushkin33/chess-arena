import type { PlayerView } from '../model/types';

interface PlayerStripProps {
  player: PlayerView | null;
  self?: boolean;
}

export function PlayerStrip({ player, self = false }: PlayerStripProps): JSX.Element {
  return (
    <div className={`player-strip ${self ? 'self-strip' : 'opponent-strip'}`}>
      <div className={`avatar ${self ? 'light-avatar' : 'dark-avatar'}`}>
        {player?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div>
        <strong>
          {player?.name ?? 'Ожидание соперника'} {self && <em>Вы</em>}
        </strong>
        <span>
          {player ? (player.color === 'white' ? 'Белые' : 'Чёрные') : 'Пригласите друга ссылкой'}
        </span>
      </div>
      <div className={`score-pill ${self ? 'accent-score' : ''}`}>{player?.wins ?? 0}</div>
    </div>
  );
}

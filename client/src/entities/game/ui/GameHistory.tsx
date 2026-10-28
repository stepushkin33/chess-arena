import type { MoveRecord } from '@chess/shared';
import { moveDetail, pieceNames } from '../lib/format';
import { PieceIcon } from './PieceIcon';

interface GameHistoryProps {
  moves: MoveRecord[];
}

export function GameHistory({ moves }: GameHistoryProps): JSX.Element {
  const pairs: Array<{ number: number; white?: MoveRecord; black?: MoveRecord }> = [];
  moves.forEach((move, index) => {
    const number = Math.floor(index / 2) + 1;
    const current = pairs[number - 1] ?? { number };
    current[move.color] = move;
    pairs[number - 1] = current;
  });

  return (
    <div className="history-list" aria-label="Подробная история ходов">
      {pairs.length === 0 && <div className="empty-history">Ходы появятся здесь</div>}
      {pairs.map((pair) => (
        <div className="history-row" key={pair.number}>
          <span className="history-number">{pair.number}.</span>
          <div className={`history-move ${pair.white ? 'history-move-active' : ''}`}>
            {pair.white && (
              <>
                <span className="history-color-dot white-dot" />
                <strong>{pair.white.notation}</strong>
                <small>
                  <PieceIcon color="white" type={pair.white.piece} /> {pieceNames[pair.white.piece]}{' '}
                  · {moveDetail(pair.white)}
                </small>
              </>
            )}
          </div>
          <div className={`history-move ${pair.black ? 'history-move-active' : ''}`}>
            {pair.black && (
              <>
                <span className="history-color-dot black-dot" />
                <strong>{pair.black.notation}</strong>
                <small>
                  <PieceIcon color="black" type={pair.black.piece} /> {pieceNames[pair.black.piece]}{' '}
                  · {moveDetail(pair.black)}
                </small>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import type { Color, MoveRecord } from '@chess/shared';
import { capturedBy, lostBy } from '../lib/format';
import { PieceIcon } from './PieceIcon';

interface CapturedPiecesProps {
  moves: MoveRecord[];
  color: Color;
}

export function CapturedPieces({ moves, color }: CapturedPiecesProps): JSX.Element {
  const taken = capturedBy(moves, color);
  const lost = lostBy(moves, color);
  return (
    <div className="captured-pieces" aria-label="Съеденные фигуры">
      <div className="captured-line">
        <span className="captured-label">Взяли</span>
        <span className="captured-icons">
          {taken.length
            ? taken.map((move, i) => (
                <PieceIcon
                  key={i}
                  color={color === 'white' ? 'black' : 'white'}
                  type={move.captured!}
                />
              ))
            : '—'}
        </span>
      </div>
      <div className="captured-line captured-lost">
        <span className="captured-label">Потеряли</span>
        <span className="captured-icons">
          {lost.length
            ? lost.map((move, i) => <PieceIcon key={i} color={color} type={move.captured!} />)
            : '—'}
        </span>
      </div>
    </div>
  );
}

import type { Color, PieceType } from '@chess/shared';
import { pieceAssetUrl } from '../lib/piece-assets';
import { pieceNames } from '../lib/format';

export function PieceIcon({
  color,
  type,
  className = '',
}: {
  color: Color;
  type: PieceType;
  className?: string;
}): JSX.Element {
  return (
    <img
      className={`piece-icon ${className}`}
      src={pieceAssetUrl(color, type)}
      alt={`${color === 'white' ? 'Белые' : 'Чёрные'}: ${pieceNames[type]}`}
      draggable={false}
    />
  );
}

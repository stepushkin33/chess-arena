import type { Color, PieceType } from '@chess/shared';

/** The same local SVGs are used by Pixi, promotion choices, and captured pieces. */
export const pieceAssetUrl = (color: Color, type: PieceType): string =>
  `/pieces/cburnett/${color === 'white' ? 'w' : 'b'}${type.toUpperCase()}.svg`;

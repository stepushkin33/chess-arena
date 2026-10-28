import {
  BISHOP_DIRECTIONS,
  getPiece,
  isInside,
  KNIGHT_OFFSETS,
  oppositeColor,
  ROOK_DIRECTIONS,
} from './board.js';
import type { Color, GameState, PieceType, Square } from './types.js';

/** Attack maps include pinned pieces (FIDE 3.1.3); they differ from legal moves. */
export const isSquareAttacked = (state: GameState, square: Square, byColor: Color): boolean => {
  const pawnRow = square.row + (byColor === 'white' ? 1 : -1);
  for (const col of [-1, 1]) {
    const piece = getPiece(state.board, { row: pawnRow, col: square.col + col });
    if (piece?.color === byColor && piece.type === 'p') return true;
  }
  for (const [row, col] of KNIGHT_OFFSETS) {
    const piece = getPiece(state.board, { row: square.row + row, col: square.col + col });
    if (piece?.color === byColor && piece.type === 'n') return true;
  }
  for (const row of [-1, 0, 1])
    for (const col of [-1, 0, 1]) {
      if (row === 0 && col === 0) continue;
      const piece = getPiece(state.board, { row: square.row + row, col: square.col + col });
      if (piece?.color === byColor && piece.type === 'k') return true;
    }
  for (const line of [
    { directions: ROOK_DIRECTIONS, types: ['r', 'q'] as PieceType[] },
    { directions: BISHOP_DIRECTIONS, types: ['b', 'q'] as PieceType[] },
  ])
    for (const direction of line.directions) {
      let target = { row: square.row + direction.row, col: square.col + direction.col };
      while (isInside(target)) {
        const piece = getPiece(state.board, target);
        if (piece) {
          if (piece.color === byColor && line.types.includes(piece.type)) return true;
          break;
        }
        target = { row: target.row + direction.row, col: target.col + direction.col };
      }
    }
  return false;
};

export const isInCheck = (state: GameState, color: Color): boolean => {
  for (let row = 0; row < 8; row += 1)
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece?.color === color && piece.type === 'k')
        return isSquareAttacked(state, { row, col }, oppositeColor(color));
    }
  return true;
};

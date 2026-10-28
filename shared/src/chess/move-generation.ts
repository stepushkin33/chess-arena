import {
  areSameSquare,
  BISHOP_DIRECTIONS,
  getPiece,
  isInside,
  KNIGHT_OFFSETS,
  oppositeColor,
  ROOK_DIRECTIONS,
} from './board.js';
import { isInCheck, isSquareAttacked } from './attacks.js';
import type { GameState, Move, PieceType, Square } from './types.js';

const pawnMoves = (state: GameState, from: Square): Move[] => {
  const piece = getPiece(state.board, from)!;
  const direction = piece.color === 'white' ? -1 : 1;
  const promotionRow = piece.color === 'white' ? 0 : 7;
  const moves: Move[] = [];
  const add = (to: Square): void => {
    if (to.row === promotionRow)
      for (const promotion of ['q', 'r', 'b', 'n'] as PieceType[])
        moves.push({ from, to, promotion });
    else moves.push({ from, to });
  };
  const one = { row: from.row + direction, col: from.col };
  if (isInside(one) && !getPiece(state.board, one)) {
    add(one);
    const two = { row: from.row + 2 * direction, col: from.col };
    if (from.row === (piece.color === 'white' ? 6 : 1) && !getPiece(state.board, two))
      moves.push({ from, to: two });
  }
  for (const offset of [-1, 1]) {
    const to = { row: from.row + direction, col: from.col + offset };
    if (!isInside(to)) continue;
    const target = getPiece(state.board, to);
    if (target && target.color !== piece.color && target.type !== 'k') add(to);
    // Only the side to move has the temporary en-passant privilege.
    if (
      piece.color === state.turn &&
      state.enPassant &&
      areSameSquare(state.enPassant, to) &&
      !target
    ) {
      const pawn = getPiece(state.board, { row: from.row, col: to.col });
      if (
        from.row === (piece.color === 'white' ? 3 : 4) &&
        pawn?.color === oppositeColor(piece.color) &&
        pawn.type === 'p'
      )
        moves.push({ from, to, enPassant: true });
    }
  }
  return moves;
};

const castleMoves = (state: GameState, from: Square): Move[] => {
  const piece = getPiece(state.board, from)!;
  const row = piece.color === 'white' ? 7 : 0;
  if (from.row !== row || from.col !== 4 || isInCheck(state, piece.color)) return [];
  const moves: Move[] = [];
  for (const kingSide of [true, false]) {
    const right =
      piece.color === 'white'
        ? kingSide
          ? state.castling.whiteKingSide
          : state.castling.whiteQueenSide
        : kingSide
          ? state.castling.blackKingSide
          : state.castling.blackQueenSide;
    const rook = getPiece(state.board, { row, col: kingSide ? 7 : 0 });
    const empty = kingSide ? [5, 6] : [1, 2, 3];
    const transit = kingSide ? [5, 6] : [3, 2];
    if (
      right &&
      rook?.color === piece.color &&
      rook.type === 'r' &&
      empty.every((col) => !getPiece(state.board, { row, col })) &&
      transit.every((col) => !isSquareAttacked(state, { row, col }, oppositeColor(piece.color)))
    ) {
      moves.push({ from, to: { row, col: kingSide ? 6 : 2 }, castle: true });
    }
  }
  return moves;
};

/** Geometry + occupancy only; legal-moves.ts removes moves leaving the king in check. */
export const generatePseudoMoves = (state: GameState, from: Square): Move[] => {
  const piece = getPiece(state.board, from);
  if (!piece) return [];
  if (piece.type === 'p') return pawnMoves(state, from);
  const moves: Move[] = [];
  const add = (to: Square): void => {
    const target = getPiece(state.board, to);
    if (isInside(to) && (!target || (target.color !== piece.color && target.type !== 'k')))
      moves.push({ from, to });
  };
  if (piece.type === 'n')
    for (const [row, col] of KNIGHT_OFFSETS) add({ row: from.row + row, col: from.col + col });
  if (piece.type === 'k') {
    for (const row of [-1, 0, 1])
      for (const col of [-1, 0, 1])
        if (row !== 0 || col !== 0) add({ row: from.row + row, col: from.col + col });
    moves.push(...castleMoves(state, from));
  }
  const directions =
    piece.type === 'q'
      ? [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS]
      : piece.type === 'r'
        ? ROOK_DIRECTIONS
        : piece.type === 'b'
          ? BISHOP_DIRECTIONS
          : [];
  for (const direction of directions) {
    let to = { row: from.row + direction.row, col: from.col + direction.col };
    while (isInside(to)) {
      add(to);
      if (getPiece(state.board, to)) break;
      to = { row: to.row + direction.row, col: to.col + direction.col };
    }
  }
  return moves;
};

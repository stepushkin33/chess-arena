import { cloneState, oppositeColor } from './board.js';
import type { CastlingRights, Color, GameState, Move, Square } from './types.js';

const revokeRookRight = (rights: CastlingRights, color: Color, square: Square): void => {
  if (color === 'white' && square.row === 7 && square.col === 0) rights.whiteQueenSide = false;
  if (color === 'white' && square.row === 7 && square.col === 7) rights.whiteKingSide = false;
  if (color === 'black' && square.row === 0 && square.col === 0) rights.blackQueenSide = false;
  if (color === 'black' && square.row === 0 && square.col === 7) rights.blackKingSide = false;
};

/** Internal simulation. Call makeMove at public boundaries. */
export const applyMoveUnchecked = (state: GameState, move: Move): GameState => {
  const next = cloneState(state);
  const piece = next.board[move.from.row][move.from.col];
  if (!piece) return next;
  const captured = next.board[move.to.row][move.to.col];
  next.board[move.from.row][move.from.col] = null;
  next.board[move.to.row][move.to.col] = { ...piece, type: move.promotion ?? piece.type };
  if (move.enPassant) next.board[move.from.row][move.to.col] = null;
  if (move.castle) {
    const rookFrom = move.to.col === 6 ? 7 : 0;
    const rookTo = move.to.col === 6 ? 5 : 3;
    next.board[move.from.row][rookTo] = next.board[move.from.row][rookFrom];
    next.board[move.from.row][rookFrom] = null;
  }
  if (piece.type === 'k') {
    if (piece.color === 'white') {
      next.castling.whiteKingSide = false;
      next.castling.whiteQueenSide = false;
    } else {
      next.castling.blackKingSide = false;
      next.castling.blackQueenSide = false;
    }
  }
  if (piece.type === 'r') revokeRookRight(next.castling, piece.color, move.from);
  if (captured?.type === 'r') revokeRookRight(next.castling, captured.color, move.to);
  next.enPassant =
    piece.type === 'p' && Math.abs(move.to.row - move.from.row) === 2
      ? { row: (move.to.row + move.from.row) / 2, col: move.from.col }
      : null;
  next.turn = oppositeColor(piece.color);
  if (piece.color === 'black') next.fullmoveNumber += 1;
  next.halfmoveClock =
    piece.type === 'p' || captured || move.enPassant ? 0 : state.halfmoveClock + 1;
  return next;
};

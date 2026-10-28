import { isInCheck } from './attacks.js';
import { oppositeColor } from './board.js';
import { generateLegalMoves } from './legal-moves.js';
import { repetitionCount } from './position.js';
import type { Board, Color, DrawClaim, GameState, Piece, Square } from './types.js';

/** Material-only dead positions. Mixed minor pieces can still permit a cooperative mate. */
export const insufficientMaterial = (board: Board): boolean => {
  const pieces: Array<{ piece: Piece; square: Square }> = [];
  board.forEach((rank, row) =>
    rank.forEach((piece, col) => {
      if (piece && piece.type !== 'k') pieces.push({ piece, square: { row, col } });
    }),
  );
  if (pieces.length === 0) return true;
  if (pieces.length === 1 && ['b', 'n'].includes(pieces[0].piece.type)) return true;
  return (
    pieces.every(({ piece }) => piece.type === 'b') &&
    new Set(pieces.map(({ square }) => (square.row + square.col) % 2)).size === 1
  );
};
export const canPossiblyMateByMaterial = (board: Board, color: Color): boolean =>
  !insufficientMaterial(board) &&
  board.some((rank) => rank.some((piece) => piece?.color === color && piece.type !== 'k'));

export const availableDrawClaims = (state: GameState): DrawClaim[] => {
  if (state.status !== 'playing') return [];
  const claims: DrawClaim[] = [];
  if (repetitionCount(state) >= 3) claims.push('threefold-repetition');
  if (state.halfmoveClock >= 100) claims.push('fifty-move-rule');
  return claims;
};
export const updateStatus = (state: GameState): void => {
  state.winner = null;
  state.drawReason = undefined;
  const moves = generateLegalMoves(state);
  // Checkmate takes precedence on the 150th reversible half-move (FIDE 9.6.2).
  if (moves.length === 0) {
    state.status = isInCheck(state, state.turn) ? 'checkmate' : 'stalemate';
    if (state.status === 'checkmate') state.winner = oppositeColor(state.turn);
    return;
  }
  if (insufficientMaterial(state.board)) state.drawReason = 'insufficient-material';
  else if (state.halfmoveClock >= 150) state.drawReason = 'seventy-five-move-rule';
  else if (repetitionCount(state) >= 5) state.drawReason = 'fivefold-repetition';
  state.status = state.drawReason ? 'draw' : 'playing';
};

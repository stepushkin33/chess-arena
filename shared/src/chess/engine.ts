import { isInCheck } from './attacks.js';
import {
  areSameSquare,
  cloneState,
  createBoard,
  getPiece,
  isInside,
  oppositeColor,
  squareKey,
  squareName,
} from './board.js';
import { availableDrawClaims, updateStatus } from './endgame.js';
import { generateLegalMoves } from './legal-moves.js';
import { positionKey } from './position.js';
import { applyMoveUnchecked } from './transition.js';
import type { Color, GameState, Move, Square } from './types.js';

export const createInitialState = (): GameState => {
  const state: GameState = {
    board: createBoard(),
    turn: 'white',
    castling: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    enPassant: null,
    status: 'playing',
    winner: null,
    moveHistory: [],
    halfmoveClock: 0,
    fullmoveNumber: 1,
    positionHistory: [],
  };
  state.positionHistory.push(positionKey(state));
  return state;
};
export const makeMove = (state: GameState, request: Move): GameState | null => {
  if (state.status !== 'playing' || !isInside(request.from) || !isInside(request.to)) return null;
  const piece = getPiece(state.board, request.from);
  if (!piece || piece.color !== state.turn) return null;
  const move = generateLegalMoves(state).find(
    (candidate) =>
      areSameSquare(candidate.from, request.from) &&
      areSameSquare(candidate.to, request.to) &&
      (candidate.promotion ?? null) === (request.promotion ?? null),
  );
  if (!move) return null;
  // Never trust special-move flags from a client: use the generated legal move.
  const next = applyMoveUnchecked(state, move);
  const captured = move.enPassant
    ? getPiece(state.board, { row: move.from.row, col: move.to.col })
    : getPiece(state.board, move.to);
  const notation = move.castle
    ? move.to.col === 6
      ? 'O-O'
      : 'O-O-O'
    : `${squareName(move.from)}${captured ? 'x' : '-'}${squareName(move.to)}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}`;
  next.moveHistory.push({
    ...move,
    color: piece.color,
    piece: piece.type,
    notation,
    captured: captured?.type,
  });
  next.positionHistory.push(positionKey(next));
  updateStatus(next);
  const record = next.moveHistory.at(-1)!;
  if (isInCheck(next, next.turn)) record.notation += next.status === 'checkmate' ? '#' : '+';
  return next;
};
/** Claims can refer to the current position or a declared next move (FIDE 9.2/9.3). */
export const claimDraw = (state: GameState, intendedMove?: Move): GameState | null => {
  if (state.status !== 'playing') return null;
  const candidate = intendedMove ? makeMove(state, intendedMove) : state;
  if (!candidate) return null;
  const claims = availableDrawClaims({ ...candidate, status: 'playing' });
  if (!claims.length) return null;
  const next = cloneState(state);
  next.status = 'draw';
  next.winner = null;
  next.drawReason = claims[0];
  return next;
};
export const threatenedSquaresForColor = (state: GameState, color: Color): Square[] => {
  const squares = new Map<string, Square>();
  for (const move of generateLegalMoves(state, oppositeColor(color))) {
    const victim = move.enPassant ? { row: move.from.row, col: move.to.col } : move.to;
    if (getPiece(state.board, victim)?.color === color) squares.set(squareKey(victim), victim);
  }
  return [...squares.values()];
};

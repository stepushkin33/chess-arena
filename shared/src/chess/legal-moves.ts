import { areSameSquare, getPiece } from './board.js';
import { isInCheck } from './attacks.js';
import { generatePseudoMoves } from './move-generation.js';
import { applyMoveUnchecked } from './transition.js';
import type { Color, GameState, Move, Square } from './types.js';

export const generateLegalMoves = (state: GameState, color: Color = state.turn): Move[] => {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row += 1)
    for (let col = 0; col < 8; col += 1) {
      if (getPiece(state.board, { row, col })?.color !== color) continue;
      for (const move of generatePseudoMoves(state, { row, col })) {
        if (!isInCheck(applyMoveUnchecked(state, move), color)) moves.push(move);
      }
    }
  return moves;
};
export const legalMovesForSquare = (state: GameState, square: Square): Move[] =>
  state.status === 'playing'
    ? generateLegalMoves(state).filter((move) => areSameSquare(move.from, square))
    : [];

import { squareKey } from './board.js';
import { generateLegalMoves } from './legal-moves.js';
import type { GameState } from './types.js';

/** Repetition includes turn/rights and only an actually LEGAL en-passant capture. */
export const positionKey = (state: GameState): string => {
  const board = state.board
    .map((row) => row.map((piece) => (piece ? `${piece.color[0]}${piece.type}` : '--')).join(''))
    .join('/');
  const rights = [
    state.castling.whiteKingSide,
    state.castling.whiteQueenSide,
    state.castling.blackKingSide,
    state.castling.blackQueenSide,
  ]
    .map((right) => (right ? '1' : '0'))
    .join('');
  const enPassant =
    state.enPassant && generateLegalMoves(state).some((move) => move.enPassant)
      ? squareKey(state.enPassant)
      : '-';
  return `${board}|${state.turn}|${rights}|${enPassant}`;
};
export const repetitionCount = (state: GameState): number => {
  const key = positionKey(state);
  return state.positionHistory.filter((position) => position === key).length;
};

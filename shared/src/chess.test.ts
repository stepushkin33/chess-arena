import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  availableDrawClaims,
  claimDraw,
  generateLegalMoves,
  isInCheck,
  legalMovesForSquare,
  makeMove,
  positionKey,
  type Board,
  type GameState,
} from './chess.js';

const emptyState = (): GameState => {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  return {
    ...createInitialState(),
    board,
    castling: {
      whiteKingSide: false,
      whiteQueenSide: false,
      blackKingSide: false,
      blackQueenSide: false,
    },
  };
};

describe('chess rules', () => {
  it('starts with twenty legal moves and blocks pieces behind pawns', () => {
    const state = createInitialState();
    expect(generateLegalMoves(state)).toHaveLength(20);
    expect(legalMovesForSquare(state, { row: 7, col: 0 })).toHaveLength(0);
  });

  it('supports a double pawn move and en passant target square', () => {
    const state = createInitialState();
    const next = makeMove(state, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    expect(next?.enPassant).toEqual({ row: 5, col: 4 });
    expect(next?.turn).toBe('black');
  });

  it('supports en passant captures', () => {
    let state = createInitialState();
    const moves = [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
      { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
      { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } },
      { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } },
      { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } },
    ];
    for (const move of moves) state = makeMove(state, move) ?? state;
    expect(state.board[2][3]).toEqual({ color: 'white', type: 'p' });
    expect(state.board[3][3]).toBeNull();
  });

  it('allows a pawn to capture an opposing piece diagonally', () => {
    let state = createInitialState();
    state = makeMove(state, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }) ?? state;
    state = makeMove(state, { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }) ?? state;
    const capture = legalMovesForSquare(state, { row: 4, col: 4 }).find(
      (move) => move.to.row === 3 && move.to.col === 3,
    );
    expect(capture).toBeDefined();
    expect(makeMove(state, capture!)?.board[3][3]).toEqual({ color: 'white', type: 'p' });
  });

  it('supports castling when the king and rook path is clear', () => {
    const state = emptyState();
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[7][7] = { color: 'white', type: 'r' };
    state.board[0][4] = { color: 'black', type: 'k' };
    state.castling.whiteKingSide = true;
    const castle = legalMovesForSquare(state, { row: 7, col: 4 }).find((move) => move.castle);
    const next = castle ? makeMove(state, castle) : null;
    expect(next?.board[7][6]).toEqual({ color: 'white', type: 'k' });
    expect(next?.board[7][5]).toEqual({ color: 'white', type: 'r' });
  });

  it('does not allow castling when the rook is missing', () => {
    const state = emptyState();
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[0][4] = { color: 'black', type: 'k' };
    state.castling.whiteKingSide = true;
    expect(legalMovesForSquare(state, { row: 7, col: 4 }).some((move) => move.castle)).toBe(false);
  });

  it('does not allow a move that captures the enemy king', () => {
    const state = emptyState();
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[0][0] = { color: 'black', type: 'k' };
    state.board[1][0] = { color: 'white', type: 'r' };
    const moves = legalMovesForSquare(state, { row: 1, col: 0 });
    expect(moves.some((move) => move.to.row === 0 && move.to.col === 0)).toBe(false);
  });

  it('rejects a move that exposes its own king to check', () => {
    const state = emptyState();
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[6][4] = { color: 'white', type: 'r' };
    state.board[0][4] = { color: 'black', type: 'r' };
    state.board[0][0] = { color: 'black', type: 'k' };
    expect(isInCheck(state, 'white')).toBe(false);
    expect(makeMove(state, { from: { row: 6, col: 4 }, to: { row: 6, col: 0 } })).toBeNull();
  });

  it('offers four promotion choices and defaults to a queen only when selected', () => {
    const state = emptyState();
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[0][4] = { color: 'black', type: 'k' };
    state.board[1][0] = { color: 'white', type: 'p' };
    const promotions = legalMovesForSquare(state, { row: 1, col: 0 });
    expect(promotions.map((move) => move.promotion)).toEqual(['q', 'r', 'b', 'n']);
    const next = makeMove(state, promotions[2]);
    expect(next?.board[0][0]).toEqual({ color: 'white', type: 'b' });
  });

  it('allows a draw claim after the same position occurs three times', () => {
    let state = createInitialState();
    const sequence = [
      [
        { row: 7, col: 6 },
        { row: 5, col: 5 },
      ],
      [
        { row: 0, col: 6 },
        { row: 2, col: 5 },
      ],
      [
        { row: 5, col: 5 },
        { row: 7, col: 6 },
      ],
      [
        { row: 2, col: 5 },
        { row: 0, col: 6 },
      ],
    ] as const;
    for (let cycle = 0; cycle < 2; cycle += 1) {
      for (const [from, to] of sequence) {
        state = makeMove(state, { from, to }) ?? state;
      }
    }
    expect(state.positionHistory.filter((key) => key === positionKey(state)).length).toBe(3);
    expect(state.status).toBe('playing');
    expect(availableDrawClaims(state)).toContain('threefold-repetition');
    expect(claimDraw(state)?.status).toBe('draw');
  });

  it('detects checkmate and annotates the final move', () => {
    let state = createInitialState();
    const moves = [
      { from: { row: 6, col: 5 }, to: { row: 5, col: 5 } },
      { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
      { from: { row: 6, col: 6 }, to: { row: 4, col: 6 } },
      { from: { row: 0, col: 3 }, to: { row: 4, col: 7 } },
    ];
    for (const move of moves) state = makeMove(state, move) ?? state;
    expect(state.status).toBe('checkmate');
    expect(state.winner).toBe('black');
    expect(state.moveHistory.at(-1)?.notation).toBe('d8-h4#');
  });

  it('detects stalemate after a legal move', () => {
    const state = emptyState();
    state.turn = 'white';
    state.board[2][1] = { color: 'white', type: 'k' };
    state.board[2][2] = { color: 'white', type: 'q' };
    state.board[0][0] = { color: 'black', type: 'k' };
    const next = makeMove(state, { from: { row: 2, col: 2 }, to: { row: 1, col: 2 } });
    expect(next?.status).toBe('stalemate');
    expect(next?.winner).toBeNull();
  });

  it('allows a draw claim after fifty moves without a pawn move or capture', () => {
    const state = emptyState();
    state.turn = 'white';
    state.halfmoveClock = 99;
    state.board[7][4] = { color: 'white', type: 'k' };
    state.board[0][4] = { color: 'black', type: 'k' };
    state.board[7][0] = { color: 'white', type: 'r' };
    const next = makeMove(state, { from: { row: 7, col: 0 }, to: { row: 6, col: 0 } });
    expect(next?.halfmoveClock).toBe(100);
    expect(next?.status).toBe('playing');
    expect(next && claimDraw(next)?.status).toBe('draw');
  });
});

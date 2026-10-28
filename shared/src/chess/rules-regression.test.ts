import { describe, expect, it } from 'vitest';
import {
  availableDrawClaims,
  claimDraw,
  createInitialState,
  generateLegalMoves,
  insufficientMaterial,
  isSquareAttacked,
  legalMovesForSquare,
  makeMove,
  positionKey,
  updateStatus,
  type GameState,
  type PieceType,
} from '../chess.js';
import { applyMoveUnchecked } from './transition.js';

/** FEN fixtures make regression positions readable without unrelated opening moves. */
const fromFen = (fen: string): GameState => {
  const [placement, turn, castling, ep, half = '0', full = '1'] = fen.split(' ');
  const state = createInitialState();
  state.board = placement.split('/').map((rank) =>
    [...rank].flatMap((symbol) =>
      /\d/.test(symbol)
        ? Array(Number(symbol)).fill(null)
        : [
            {
              color: symbol === symbol.toUpperCase() ? ('white' as const) : ('black' as const),
              type: symbol.toLowerCase() as PieceType,
            },
          ],
    ),
  );
  state.turn = turn === 'w' ? 'white' : 'black';
  state.castling = {
    whiteKingSide: castling.includes('K'),
    whiteQueenSide: castling.includes('Q'),
    blackKingSide: castling.includes('k'),
    blackQueenSide: castling.includes('q'),
  };
  state.enPassant = ep === '-' ? null : { row: 8 - Number(ep[1]), col: ep.charCodeAt(0) - 97 };
  state.halfmoveClock = Number(half);
  state.fullmoveNumber = Number(full);
  state.positionHistory = [positionKey(state)];
  return state;
};
const perft = (state: GameState, depth: number): number =>
  depth === 0
    ? 1
    : generateLegalMoves(state).reduce(
        (total, move) => total + perft(applyMoveUnchecked(state, move), depth - 1),
        0,
      );

describe('move-generation reference trees', () => {
  it('matches all initial-position branches through four plies', () => {
    expect(perft(createInitialState(), 3)).toBe(8902);
    expect(perft(createInitialState(), 4)).toBe(197281);
  }, 20000);
  it('matches the Kiwipete castling/pins position through three plies', () => {
    const state = fromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perft(state, 1)).toBe(48);
    expect(perft(state, 2)).toBe(2039);
    expect(perft(state, 3)).toBe(97862);
  }, 20000);
  it('matches the rook/pawn en-passant endgame reference tree', () => {
    const state = fromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(perft(state, 3)).toBe(2812);
  });
});

describe('special rules and invalid requests', () => {
  it('disallows castling while checked, through check, or into check', () => {
    for (const fen of [
      'k3r3/8/8/8/8/8/8/4K2R w K - 0 1',
      'k4r2/8/8/8/8/8/8/4K2R w K - 0 1',
      'k5r1/8/8/8/8/8/8/4K2R w K - 0 1',
    ]) {
      expect(generateLegalMoves(fromFen(fen)).some((move) => move.castle)).toBe(false);
    }
  });
  it('allows queen-side castling if only b1 is attacked', () => {
    expect(
      generateLegalMoves(fromFen('1r5k/8/8/8/8/8/8/R3K3 w Q - 0 1')).some((move) => move.castle),
    ).toBe(true);
  });
  it('permanently revokes castling after moving the rook back', () => {
    let state = fromFen('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
    state = makeMove(state, { from: { row: 7, col: 7 }, to: { row: 6, col: 7 } })!;
    state = makeMove(state, { from: { row: 0, col: 4 }, to: { row: 1, col: 4 } })!;
    state = makeMove(state, { from: { row: 6, col: 7 }, to: { row: 7, col: 7 } })!;
    expect(state.castling.whiteKingSide).toBe(false);
  });
  it('rejects en passant that uncovers a rook attack on the king', () => {
    const state = fromFen('7k/8/8/r4pPK/8/8/8/8 w - f6 0 1');
    expect(generateLegalMoves(state).some((move) => move.enPassant)).toBe(false);
    expect(positionKey(state)).toBe(positionKey({ ...state, enPassant: null }));
  });
  it('records the captured pawn on en passant and expires the privilege after a reply', () => {
    const state = fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
    const move = generateLegalMoves(state).find((move) => move.enPassant)!;
    expect(makeMove(state, move)?.moveHistory.at(-1)?.captured).toBe('p');
    expect(
      makeMove(state, { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } })?.enPassant,
    ).toBeNull();
  });
  it('counts only legal en-passant rights for repetition', () => {
    const afterE4 = makeMove(createInitialState(), {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
    })!;
    expect(positionKey(afterE4)).toBe(positionKey({ ...afterE4, enPassant: null }));
    const state = fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
    expect(positionKey(state)).not.toBe(positionKey({ ...state, enPassant: null }));
  });
  it('counts attacks by pinned pieces and prevents adjacent kings', () => {
    const pinned = fromFen('4k3/4n3/8/8/8/8/8/K3R3 w - - 0 1');
    expect(isSquareAttacked(pinned, { row: 3, col: 5 }, 'black')).toBe(true);
    const state = fromFen('8/8/8/8/8/4k3/8/4K3 w - - 0 1');
    expect(makeMove(state, { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } })).toBeNull();
  });
  it('offers all underpromotions on capture for both colours', () => {
    for (const [fen, row, col] of [
      ['1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1', 1, 0],
      ['4k3/8/8/8/8/8/p7/1R2K3 b - - 0 1', 6, 0],
    ] as const) {
      const moves = legalMovesForSquare(fromFen(fen), { row, col }).filter(
        (move) => move.to.col === 1,
      );
      expect(moves.map((move) => move.promotion)).toEqual(['q', 'r', 'b', 'n']);
    }
  });
  it('does not trust forged special flags, fractional or outside coordinates', () => {
    const state = createInitialState();
    const next = makeMove(state, {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      castle: true,
      enPassant: true,
    });
    expect(next?.board[7][7]?.type).toBe('r');
    expect(next?.moveHistory[0].castle).toBeUndefined();
    expect(makeMove(state, { from: { row: 6.5, col: 4 }, to: { row: 4, col: 4 } })).toBeNull();
    expect(makeMove(state, { from: { row: -1, col: 4 }, to: { row: 4, col: 4 } })).toBeNull();
    expect(state).toEqual(createInitialState());
  });
});

describe('draw adjudication', () => {
  it('automatically draws on fivefold repetition but only offers a claim on threefold', () => {
    const state = createInitialState();
    state.positionHistory = Array(3).fill(positionKey(state));
    updateStatus(state);
    expect(state.status).toBe('playing');
    expect(availableDrawClaims(state)).toContain('threefold-repetition');
    state.positionHistory = Array(5).fill(positionKey(state));
    updateStatus(state);
    expect(state.drawReason).toBe('fivefold-repetition');
  });
  it('supports a 50-move claim on an intended move and automatic 75 moves', () => {
    const state = fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 99 1');
    expect(claimDraw(state)).toBeNull();
    expect(claimDraw(state, { from: { row: 7, col: 0 }, to: { row: 6, col: 0 } })?.drawReason).toBe(
      'fifty-move-rule',
    );
    state.halfmoveClock = 150;
    updateStatus(state);
    expect(state.drawReason).toBe('seventy-five-move-rule');
  });
  it('gives checkmate priority over the 75-move threshold', () => {
    const state = fromFen('7k/8/5KQ1/8/8/8/8/8 w - - 149 1');
    expect(makeMove(state, { from: { row: 2, col: 6 }, to: { row: 1, col: 6 } })?.status).toBe(
      'checkmate',
    );
  });
  it('recognizes same-colour promoted bishops, but not two knights as dead material', () => {
    expect(insufficientMaterial(fromFen('4k3/8/8/8/4B3/8/2B5/4K3 w - - 0 1').board)).toBe(true);
    expect(insufficientMaterial(fromFen('4k3/8/8/8/8/8/2NN4/4K3 w - - 0 1').board)).toBe(false);
  });
});

import type { Board, Color, GameState, Piece, PieceType, Square } from './types.js';

export const oppositeColor = (color: Color): Color => (color === 'white' ? 'black' : 'white');
export const squareName = ({ row, col }: Square): string =>
  `${String.fromCharCode(97 + col)}${8 - row}`;
export const squareKey = ({ row, col }: Square): string => `${row}:${col}`;
export const areSameSquare = (a: Square, b: Square): boolean => a.row === b.row && a.col === b.col;
export const isInside = (square: Square): boolean =>
  Number.isInteger(square.row) &&
  Number.isInteger(square.col) &&
  square.row >= 0 &&
  square.row < 8 &&
  square.col >= 0 &&
  square.col < 8;
export const getPiece = (board: Board, square: Square): Piece | null =>
  isInside(square) ? board[square.row][square.col] : null;
export const createBoard = (): Board => {
  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const board: Board = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  for (let col = 0; col < 8; col += 1) {
    board[0][col] = { color: 'black', type: backRank[col] };
    board[1][col] = { color: 'black', type: 'p' };
    board[6][col] = { color: 'white', type: 'p' };
    board[7][col] = { color: 'white', type: backRank[col] };
  }
  return board;
};

/** Pure rules never mutate the caller's board, history, or castling rights. */
export const cloneState = (state: GameState): GameState => ({
  ...state,
  board: state.board.map((row) => row.map((piece) => (piece ? { ...piece } : null))),
  castling: { ...state.castling },
  enPassant: state.enPassant ? { ...state.enPassant } : null,
  moveHistory: state.moveHistory.map((move) => ({
    ...move,
    from: { ...move.from },
    to: { ...move.to },
  })),
  positionHistory: [...state.positionHistory],
});

export const ROOK_DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];
export const BISHOP_DIRECTIONS = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];
export const KNIGHT_OFFSETS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

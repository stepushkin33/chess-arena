/** Coordinates are absolute: a8 = {row: 0, col: 0}, regardless of board orientation. */
export type Color = 'white' | 'black';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export interface Piece {
  color: Color;
  type: PieceType;
}
export interface Square {
  row: number;
  col: number;
}
export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  castle?: boolean;
  enPassant?: boolean;
}
export interface MoveRecord extends Move {
  color: Color;
  piece: PieceType;
  notation: string;
  captured?: PieceType;
}
export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}
export type Board = Array<Array<Piece | null>>;
export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
export type DrawReason =
  | 'agreement'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fivefold-repetition'
  | 'fifty-move-rule'
  | 'seventy-five-move-rule';
export type DrawClaim = 'threefold-repetition' | 'fifty-move-rule';
export interface GameState {
  board: Board;
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  status: GameStatus;
  winner: Color | null;
  drawReason?: DrawReason;
  moveHistory: MoveRecord[];
  halfmoveClock: number;
  fullmoveNumber: number;
  positionHistory: string[];
}

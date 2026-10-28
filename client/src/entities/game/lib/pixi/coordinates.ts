import type { Color, Square } from '@chess/shared';

export const BOARD_SIZE = 640;
export const CELL_SIZE = BOARD_SIZE / 8;

// Rotating the view must never rotate the coordinates sent to the server.
export const orientSquare = (square: Square, orientation: Color): Square =>
  orientation === 'white' ? square : { row: 7 - square.row, col: 7 - square.col };
export const squarePosition = (square: Square, orientation: Color): { x: number; y: number } => {
  const visible = orientSquare(square, orientation);
  return { x: visible.col * CELL_SIZE, y: visible.row * CELL_SIZE };
};

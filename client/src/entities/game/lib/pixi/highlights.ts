import { Container, Graphics } from 'pixi.js';
import type { Color, GameState, Move, Square } from '@chess/shared';
import { CELL_SIZE, squarePosition } from './coordinates';

export const clearLayer = (layer: Container): void => {
  for (const child of layer.removeChildren()) child.destroy({ children: true });
};
export const drawHighlights = (
  layer: Container,
  state: GameState,
  orientation: Color,
  selected: Square | null,
  legalMoves: Move[],
  threatened: Square[],
): void => {
  clearLayer(layer);
  const fillSquare = (square: Square, color: number, alpha: number): void => {
    const { x, y } = squarePosition(square, orientation);
    const mark = new Graphics()
      .beginFill(color, alpha)
      .drawRect(x, y, CELL_SIZE, CELL_SIZE)
      .endFill();
    layer.addChild(mark);
  };
  for (const square of threatened) fillSquare(square, 0xf29a38, 0.38);
  if (selected) fillSquare(selected, 0xf6c453, 0.35);
  for (const move of legalMoves) {
    const { x, y } = squarePosition(move.to, orientation);
    const capture = Boolean(state.board[move.to.row][move.to.col] || move.enPassant);
    const mark = new Graphics().beginFill(capture ? 0xf29a38 : 0x345a47, capture ? 0.5 : 0.72);
    if (capture) mark.drawRect(x, y, CELL_SIZE, CELL_SIZE);
    else mark.drawCircle(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE * 0.1);
    mark.endFill();
    layer.addChild(mark);
  }
};

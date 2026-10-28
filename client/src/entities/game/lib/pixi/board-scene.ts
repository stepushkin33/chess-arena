import { Application, Container, Graphics, Text } from 'pixi.js';
import type { Color, GameState, Move, MoveRecord, Square } from '@chess/shared';
import { BOARD_SIZE, CELL_SIZE, orientSquare } from './coordinates';
import { drawHighlights } from './highlights';
import { PieceLayer } from './piece-layer';
import type { PieceTextures } from './piece-textures';

export interface BoardView {
  state: GameState;
  selected: Square | null;
  legalMoves: Move[];
  threatenedSquares: Square[];
  lastMove: MoveRecord | null;
}

/** A Pixi scene lives for the entire mounted board. React only sends new view data. */
export class BoardScene {
  private readonly app: Application;
  private readonly highlights = new Container();
  private readonly pieces: PieceLayer;
  private previousState: GameState | undefined;

  constructor(
    host: HTMLDivElement,
    private readonly orientation: Color,
    textures: PieceTextures,
    onClick: (square: Square) => void,
  ) {
    this.app = new Application({
      width: BOARD_SIZE,
      height: BOARD_SIZE,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 3),
      autoDensity: true,
    });
    const cells = new Container();
    const labels = new Container();
    this.pieces = new PieceLayer(textures, orientation);
    this.highlights.eventMode = 'none';
    labels.eventMode = 'none';
    this.app.stage.addChild(cells, this.highlights, this.pieces.container, labels);
    host.replaceChildren(this.app.view as HTMLCanvasElement);
    for (let row = 0; row < 8; row += 1)
      for (let col = 0; col < 8; col += 1) {
        const square = orientSquare({ row, col }, orientation);
        const light = (square.row + square.col) % 2 === 0;
        const cell = new Graphics()
          .beginFill(light ? 0xead3a8 : 0x8c7558)
          .drawRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          .endFill();
        cell.eventMode = 'static';
        cell.cursor = 'pointer';
        cell.on('pointertap', () => onClick(square));
        cells.addChild(cell);
        const style = {
          fontFamily: 'sans-serif',
          fontSize: 11,
          fontWeight: '700' as const,
          fill: light ? 0x8c7558 : 0xead3a8,
        };
        if (col === 0) {
          const label = new Text(String(8 - square.row), style);
          label.position.set(4, row * CELL_SIZE + 3);
          labels.addChild(label);
        }
        if (row === 7) {
          const label = new Text(String.fromCharCode(97 + square.col), style);
          label.anchor.set(1, 1);
          label.position.set((col + 1) * CELL_SIZE - 4, BOARD_SIZE - 3);
          labels.addChild(label);
        }
      }
  }
  update(view: BoardView): void {
    drawHighlights(
      this.highlights,
      view.state,
      this.orientation,
      view.selected,
      view.legalMoves,
      view.threatenedSquares,
    );
    if (this.previousState !== view.state) this.pieces.render(view.state, view.lastMove);
    this.previousState = view.state;
  }
  destroy(): void {
    this.pieces.destroy();
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
  }
}

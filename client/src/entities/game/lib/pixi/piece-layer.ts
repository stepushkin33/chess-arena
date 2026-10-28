import { Container, Sprite } from 'pixi.js';
import type { Color, GameState, MoveRecord, Square } from '@chess/shared';
import { CELL_SIZE, squarePosition } from './coordinates';
import { clearLayer } from './highlights';
import { textureKey, type PieceTextures } from './piece-textures';

/** Owns only sprites/animation; it has no knowledge of React, clicks, or chess rules. */
export class PieceLayer {
  readonly container = new Container();
  private frame = 0;
  private renderedMove = '';
  private initialized = false;

  constructor(
    private readonly textures: PieceTextures,
    private readonly orientation: Color,
  ) {}

  render(state: GameState, lastMove: MoveRecord | null): void {
    cancelAnimationFrame(this.frame);
    clearLayer(this.container);
    const moveId = `${state.moveHistory.length}:${lastMove?.notation ?? ''}`;
    const shouldAnimate =
      this.initialized &&
      moveId !== this.renderedMove &&
      Boolean(lastMove) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animated: Array<{
      sprite: Sprite;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }> = [];
    for (let row = 0; row < 8; row += 1)
      for (let col = 0; col < 8; col += 1) {
        const piece = state.board[row][col];
        if (!piece) continue;
        const sprite = new Sprite(this.textures.get(textureKey(piece))!);
        sprite.width = CELL_SIZE;
        sprite.height = CELL_SIZE;
        sprite.eventMode = 'none';
        const to = squarePosition({ row, col }, this.orientation);
        let source: Square | undefined;
        if (shouldAnimate && lastMove) {
          if (row === lastMove.to.row && col === lastMove.to.col) source = lastMove.from;
          if (lastMove.castle && row === lastMove.to.row && col === (lastMove.to.col === 6 ? 5 : 3))
            source = { row, col: lastMove.to.col === 6 ? 7 : 0 };
        }
        sprite.position.set(to.x, to.y);
        if (source) {
          const from = squarePosition(source, this.orientation);
          sprite.position.set(from.x, from.y);
          animated.push({ sprite, from, to });
        }
        this.container.addChild(sprite);
      }
    this.renderedMove = moveId;
    this.initialized = true;
    if (!animated.length) return;
    // Moving sprites render above the stationary pieces. Both king and rook animate.
    for (const { sprite } of animated)
      this.container.setChildIndex(sprite, this.container.children.length - 1);
    const started = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - started) / 240);
      const eased = 1 - (1 - progress) ** 3;
      for (const { sprite, from, to } of animated)
        sprite.position.set(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased);
      if (progress < 1) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  destroy(): void {
    cancelAnimationFrame(this.frame);
  }
}

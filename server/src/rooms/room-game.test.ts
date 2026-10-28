import { describe, expect, it } from 'vitest';
import { createMatch } from './room.fixture.js';

describe('room game', () => {
  it('rejects malformed moves, wrong turns and illegal geometry', () => {
    const { game, white, black } = createMatch();
    for (const move of [
      null,
      { from: { row: 6.5, col: 0 }, to: { row: 5, col: 0 } },
      { from: { row: 6, col: 0 }, to: { row: 9, col: 0 } },
    ])
      expect(() => game.move(white.id, move)).toThrow();
    expect(() => game.move(black.id, { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } })).toThrow(
      'Сейчас ход соперника',
    );
    expect(() => game.move(white.id, { from: { row: 6, col: 0 }, to: { row: 3, col: 0 } })).toThrow(
      'невозможен',
    );
  });
  it('requires an opponent before playing', () => {
    const { membership, game, white, black } = createMatch();
    membership.leave(black.id);
    expect(() => game.move(white.id, { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } })).toThrow(
      'второго игрока',
    );
  });
  it('awards a win only once and rejects moves after resignation', () => {
    const { game, white, black, view } = createMatch();
    game.resign(black.id);
    expect(() => game.resign(black.id)).toThrow('завершена');
    expect(() => game.move(white.id, { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } })).toThrow(
      'завершена',
    );
    expect(view(white.id).you.wins).toBe(1);
  });
  it('validates draw claims and only accepts them from the side to move', () => {
    const { game, room, white, black } = createMatch();
    expect(() => game.claimDraw(white.id)).toThrow('Оснований');
    room.state.positionHistory = Array(3).fill(room.state.positionHistory[0]);
    expect(() => game.claimDraw(black.id)).toThrow('свой ход');
    expect(game.claimDraw(white.id).room.state.drawReason).toBe('threefold-repetition');
  });
  it('does not award a win to a bare king after resignation', () => {
    const { game, room, white, black, view } = createMatch();
    room.state.board = room.state.board.map((rank) =>
      rank.map((piece) => (piece?.color === 'black' && piece.type !== 'k' ? null : piece)),
    );
    expect(game.resign(white.id).room.state.status).toBe('draw');
    expect(view(black.id).you.wins).toBe(0);
  });
});

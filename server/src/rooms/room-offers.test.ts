import { describe, expect, it } from 'vitest';
import { createMatch } from './room.fixture.js';

describe('room offers', () => {
  it('allows a draw only after both players have moved', () => {
    const { offers, white, opening } = createMatch();
    expect(() => offers.propose(white.id, 'draw')).toThrow('первого хода');
    opening();
    expect(offers.propose(white.id, 'draw').event).toBe('room_state');
  });
  it('accepts a draw only from the opponent and locks moves while waiting', () => {
    const { offers, game, white, black, opening, view } = createMatch();
    opening();
    offers.propose(white.id, 'draw');
    expect(view(white.id).drawOfferPending).toBe(true);
    expect(view(black.id).drawOfferFrom?.name).toBe('White');
    expect(() => offers.respond(white.id, 'draw', true)).toThrow('собственное');
    expect(() => offers.propose(black.id, 'draw')).toThrow('ожидает');
    expect(() => game.move(white.id, { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } })).toThrow(
      'ответа',
    );
    expect(offers.respond(black.id, 'draw', true).room.state.drawReason).toBe('agreement');
  });
  it('declines a draw and only notifies its offerer', () => {
    const { offers, white, black, opening, view } = createMatch();
    opening();
    offers.propose(white.id, 'draw');
    const change = offers.respond(black.id, 'draw', false);
    expect(change.notification).toEqual({ connectionId: white.id, event: 'draw_declined' });
    expect(view(white.id).drawOfferPending).toBe(false);
  });
  it('only lets its offerer cancel, and rejects stale responses', () => {
    const { offers, white, black, opening, room } = createMatch();
    opening();
    offers.propose(white.id, 'draw');
    expect(() => offers.cancelDraw(black.id)).toThrow();
    offers.cancelDraw(white.id);
    expect(() => offers.respond(black.id, 'draw', true)).toThrow('Активного');
    expect(room.state.status).toBe('playing');
  });
  it('starts a rematch only after accepting, preserving the score', () => {
    const { game, offers, white, black, room, view } = createMatch();
    expect(() => offers.propose(white.id, 'rematch')).toThrow('завершения');
    game.resign(black.id);
    offers.propose(white.id, 'rematch');
    expect(view(black.id).rematchOfferFrom?.name).toBe('White');
    expect(() => offers.propose(black.id, 'rematch')).toThrow('ожидает');
    expect(() => offers.respond(white.id, 'rematch', true)).toThrow('собственное');
    offers.respond(black.id, 'rematch', false);
    expect(room.state.status).toBe('resigned');
    offers.propose(black.id, 'rematch');
    offers.respond(white.id, 'rematch', true);
    expect(room.state.status).toBe('playing');
    expect(room.state.moveHistory).toEqual([]);
    expect(room.offer).toBeNull();
    expect(view(white.id).you.wins).toBe(1);
  });
});

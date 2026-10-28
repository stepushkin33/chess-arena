import { describe, expect, it } from 'vitest';
import { createMatch } from './room.fixture.js';

describe('room membership', () => {
  it('presents a separate view to each player', () => {
    const { view, white, black } = createMatch();
    expect(view(white.id)).toMatchObject({
      playersCount: 2,
      you: { name: 'White', color: 'white' },
      opponent: { name: 'Black' },
    });
    expect(view(black.id)).toMatchObject({
      you: { name: 'Black', color: 'black' },
      opponent: { name: 'White' },
    });
  });
  it('rejects a third player with a room-full code', () => {
    const { membership, connect, room } = createMatch();
    expect(() => membership.join(connect().id, room.id, 'Third')).toThrow(
      expect.objectContaining({ code: 'ROOM_FULL' }),
    );
  });
  it('reports unknown rooms with a distinct error code', () => {
    const { membership, connect } = createMatch();
    expect(() => membership.join(connect().id, 'MISSING', 'Third')).toThrow(
      expect.objectContaining({ code: 'ROOM_NOT_FOUND' }),
    );
  });
  it('clears pending offers on departure and frees the occupied colour', () => {
    const { membership, offers, white, black, room, connect, opening } = createMatch();
    opening();
    offers.propose(white.id, 'draw');
    membership.leave(black.id);
    expect(room.offer).toBeNull();
    expect(room.players.size).toBe(1);
    const replacement = connect();
    membership.join(replacement.id, room.id.toLowerCase(), 'New player');
    expect(room.players.get('black')?.connectionId).toBe(replacement.id);
  });
  it('removes empty rooms', () => {
    const { membership, rooms, room, white, black } = createMatch();
    membership.leave(white.id);
    membership.leave(black.id);
    expect(rooms.find(room.id)).toBeUndefined();
  });
  it('keeps two connections with the same guest id separate', () => {
    const { membership, room, white, black, view } = createMatch();
    membership.leave(black.id);
    membership.join(black.id, room.id, 'Other tab', white.playerId);
    expect(view(black.id)).toMatchObject({
      you: { name: 'Other tab', color: 'black' },
      opponent: { name: 'White', color: 'white' },
    });
  });
});

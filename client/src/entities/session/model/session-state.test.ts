import { describe, expect, it } from 'vitest';
import { createInitialState, type RoomView } from '@chess/shared';
import { initialSession, sessionReducer } from './session-state';

const room: RoomView = {
  roomId: 'ABC123',
  inviteUrl: '/room/ABC123',
  state: createInitialState(),
  you: { id: 'white', name: 'White', color: 'white', wins: 0 },
  opponent: null,
  playersCount: 1,
  drawOfferFrom: null,
  drawOfferPending: false,
  rematchOfferFrom: null,
  rematchOfferPending: false,
  rematchRequested: false,
};

describe('room session transitions', () => {
  it('enters the room after a successful join and clears previous errors', () => {
    const before = { ...initialSession('ABC123'), accessError: 'not-found' as const };
    expect(sessionReducer(before, { event: 'room_joined', data: room })).toMatchObject({
      room,
      accessError: null,
    });
  });
  it('shows separate unavailable-room screens', () => {
    const before = initialSession('ABC123');
    expect(
      sessionReducer(before, { event: 'error', data: { code: 'ROOM_FULL', message: 'Full' } })
        .accessError,
    ).toBe('full');
    expect(
      sessionReducer(before, {
        event: 'error',
        data: { code: 'ROOM_NOT_FOUND', message: 'Missing' },
      }).accessError,
    ).toBe('not-found');
  });
  it('does not reopen a room from a delayed game update after leaving', () => {
    const joined = sessionReducer(initialSession(null), { event: 'room_joined', data: room });
    const left = sessionReducer(joined, { event: 'navigate', roomId: null });
    expect(sessionReducer(left, { event: 'game_state', data: room })).toBe(left);
  });
  it('ignores updates for another room and displays recoverable errors without leaving', () => {
    const joined = sessionReducer(initialSession(null), { event: 'room_created', data: room });
    expect(
      sessionReducer(joined, { event: 'room_state', data: { ...room, roomId: 'OTHER1' } }),
    ).toBe(joined);
    expect(
      sessionReducer(joined, { event: 'error', data: { message: 'Illegal move' } }),
    ).toMatchObject({ room, notice: 'Illegal move' });
  });
  it('clears a declined-offer notice when the next room update arrives', () => {
    const joined = { ...initialSession(null), room };
    const declined = sessionReducer(joined, { event: 'draw_declined', data: {} });
    expect(declined.notice).toContain('отказался');
    expect(sessionReducer(declined, { event: 'room_state', data: room }).notice).toBe('');
  });
});

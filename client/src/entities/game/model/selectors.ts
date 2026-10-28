import type { RoomView } from '@chess/shared';

export const isYourTurn = (room: RoomView): boolean =>
  room.state.status === 'playing' && room.state.turn === room.you.color;
export const hasPendingOffer = (room: RoomView): boolean =>
  Boolean(
    room.drawOfferFrom ||
    room.drawOfferPending ||
    room.rematchOfferFrom ||
    room.rematchOfferPending,
  );
export const canMovePiece = (room: RoomView, connected: boolean): boolean =>
  connected && room.playersCount === 2 && isYourTurn(room) && !hasPendingOffer(room);

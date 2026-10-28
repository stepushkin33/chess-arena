import { useEffect, useState } from 'react';
import { availableDrawClaims } from '@chess/shared';
import {
  useActiveRoom,
  useSessionActions,
  useSessionState,
} from '../../../entities/session/model/SessionProvider';
import { hasPendingOffer, isYourTurn } from '../../../entities/game/model/selectors';

export type ConfirmedAction = 'draw' | 'resign';
export type OfferKind = 'draw' | 'rematch';

export function useGameActions() {
  const room = useActiveRoom();
  const { connected } = useSessionState();
  const { send } = useSessionActions();
  const [confirmation, setConfirmation] = useState<ConfirmedAction | null>(null);
  const playing = room.state.status === 'playing';
  const locked = !connected || room.playersCount !== 2 || hasPendingOffer(room);
  const incoming: OfferKind | null = room.drawOfferFrom
    ? 'draw'
    : room.rematchOfferFrom
      ? 'rematch'
      : null;

  useEffect(() => {
    setConfirmation(null);
  }, [room]);

  const confirm = (): void => {
    if (locked || !confirmation) return;
    send({ event: confirmation === 'draw' ? 'offer_draw' : 'resign' });
    setConfirmation(null);
  };
  const respond = (accept: boolean): void => {
    if (incoming && connected)
      send({ event: incoming === 'draw' ? 'respond_draw' : 'respond_rematch', data: { accept } });
  };
  return {
    playing,
    locked,
    incoming,
    connected,
    confirmation,
    opponentName: room.opponent?.name ?? 'Соперник',
    drawPending: room.drawOfferPending,
    rematchPending: room.rematchRequested,
    canOfferDraw: !locked && room.state.moveHistory.length >= 2,
    canClaimDraw: !locked && isYourTurn(room) && availableDrawClaims(room.state).length > 0,
    ask: setConfirmation,
    cancel: () => setConfirmation(null),
    confirm,
    respond,
    withdraw: () => send({ event: 'cancel_draw' }),
    rematch: () => send({ event: 'rematch' }),
    claim: () => send({ event: 'claim_draw', data: {} }),
  };
}

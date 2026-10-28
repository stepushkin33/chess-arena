import { Inject, Injectable } from '@nestjs/common';
import { createInitialState } from '@chess/shared';
import { RoomAccess } from './room.access.js';
import { RoomError } from './room.error.js';
import type { OfferKind, Room, RoomChange } from './room.types.js';

/** Draw and rematch share one offer lifecycle: propose, answer, optionally withdraw. */
@Injectable()
export class RoomOffers {
  constructor(@Inject(RoomAccess) private readonly access: RoomAccess) {}

  propose(connectionId: string, kind: OfferKind): RoomChange {
    const { room } = this.access.player(connectionId);
    this.requireOfferPhase(room, kind);
    if (room.offer) throw new RoomError('Предложение уже ожидает ответа.');
    if (kind === 'draw' && room.state.moveHistory.length < 2)
      throw new RoomError('Предложить ничью можно после первого хода обоих игроков.');
    room.offer = { kind, fromConnectionId: connectionId };
    return { kind: 'update', room, event: 'room_state' };
  }
  respond(connectionId: string, kind: OfferKind, accepted: boolean): RoomChange {
    const { room } = this.access.player(connectionId);
    this.requireOfferPhase(room, kind);
    const offer = room.offer;
    if (!offer || offer.kind !== kind) throw new RoomError('Активного предложения нет.');
    if (offer.fromConnectionId === connectionId)
      throw new RoomError('Нельзя ответить на собственное предложение.');
    room.offer = null;
    if (!accepted)
      return {
        kind: 'update',
        room,
        event: 'room_state',
        notification: {
          connectionId: offer.fromConnectionId,
          event: kind === 'draw' ? 'draw_declined' : 'rematch_declined',
        },
      };
    if (kind === 'draw') {
      room.state.status = 'draw';
      room.state.winner = null;
      room.state.drawReason = 'agreement';
    } else {
      room.state = createInitialState();
      room.resultAwarded = false;
    }
    return { kind: 'update', room, event: 'game_state' };
  }
  cancelDraw(connectionId: string): RoomChange {
    const { room } = this.access.player(connectionId);
    if (room.offer?.kind !== 'draw' || room.offer.fromConnectionId !== connectionId)
      throw new RoomError('Вашего активного предложения ничьей нет.');
    room.offer = null;
    return { kind: 'update', room, event: 'room_state' };
  }
  private requireOfferPhase(room: Room, kind: OfferKind): void {
    this.access.requireOpponent(room);
    if (kind === 'draw') this.access.requirePlaying(room);
    else if (room.state.status === 'playing')
      throw new RoomError('Новая партия доступна после завершения текущей.');
  }
}

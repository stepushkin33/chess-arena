import { Inject, Injectable } from '@nestjs/common';
import { canPossiblyMateByMaterial, claimDraw, makeMove, oppositeColor } from '@chess/shared';
import { RoomAccess } from './room.access.js';
import { RoomError } from './room.error.js';
import { Scoreboard } from './scoreboard.service.js';
import { isMove } from './room.validation.js';
import type { RoomChange } from './room.types.js';

@Injectable()
export class RoomGame {
  constructor(
    @Inject(RoomAccess) private readonly access: RoomAccess,
    @Inject(Scoreboard) private readonly scores: Scoreboard,
  ) {}

  move(connectionId: string, request: unknown): RoomChange {
    const { room, player } = this.access.player(connectionId);
    this.access.requireOpponent(room);
    this.access.requirePlaying(room);
    if (!isMove(request)) throw new RoomError('Некорректный формат хода.');
    if (room.offer) throw new RoomError('Дождитесь ответа на ничью или отзовите предложение.');
    if (room.state.turn !== player.color) throw new RoomError('Сейчас ход соперника.');
    const state = makeMove(room.state, request);
    if (!state) throw new RoomError('Этот ход невозможен.');
    room.state = state;
    this.scores.awardWinner(room);
    return { kind: 'update', room, event: 'game_state' };
  }
  resign(connectionId: string): RoomChange {
    const { room, player } = this.access.player(connectionId);
    this.access.requireOpponent(room);
    this.access.requirePlaying(room);
    const winner = oppositeColor(player.color);
    const canMate = canPossiblyMateByMaterial(room.state.board, winner);
    room.state.status = canMate ? 'resigned' : 'draw';
    room.state.winner = canMate ? winner : null;
    if (!canMate) room.state.drawReason = 'insufficient-material';
    room.offer = null;
    this.scores.awardWinner(room);
    return { kind: 'update', room, event: 'game_state' };
  }
  claimDraw(connectionId: string, intendedMove?: unknown): RoomChange {
    const { room, player } = this.access.player(connectionId);
    this.access.requireOpponent(room);
    this.access.requirePlaying(room);
    if (room.state.turn !== player.color)
      throw new RoomError('Заявить ничью можно только в свой ход.');
    if (intendedMove !== undefined && !isMove(intendedMove))
      throw new RoomError('Некорректный ход для заявления ничьей.');
    const state = claimDraw(room.state, intendedMove);
    if (!state) throw new RoomError('Оснований для заявления ничьей нет.');
    room.state = state;
    room.offer = null;
    return { kind: 'update', room, event: 'game_state' };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { ConnectionRegistry } from '../connections/connection.registry.js';
import { RoomStore } from './room.store.js';
import { RoomError } from './room.error.js';
import type { Room } from './room.types.js';
import { playerForConnection } from './room.presenter.js';

@Injectable()
export class RoomAccess {
  constructor(
    @Inject(ConnectionRegistry) private readonly connections: ConnectionRegistry,
    @Inject(RoomStore) private readonly rooms: RoomStore,
  ) {}

  player(connectionId: string) {
    const connection = this.connections.get(connectionId);
    const room = connection.roomId ? this.rooms.find(connection.roomId) : undefined;
    if (!room) throw new RoomError('Вы ещё не вошли в комнату.');
    const player = playerForConnection(room, connectionId);
    if (!player) throw new RoomError('Игрок не найден в комнате.');
    return { room, player };
  }
  requireOpponent(room: Room): void {
    if (room.players.size !== 2) throw new RoomError('Ожидаем второго игрока.');
  }
  requirePlaying(room: Room): void {
    if (room.state.status !== 'playing') throw new RoomError('Партия уже завершена.');
  }
}

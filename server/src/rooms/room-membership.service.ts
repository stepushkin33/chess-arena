import { Inject, Injectable } from '@nestjs/common';
import type { Color } from '@chess/shared';
import { ConnectionRegistry } from '../connections/connection.registry.js';
import { RoomStore } from './room.store.js';
import { Scoreboard } from './scoreboard.service.js';
import { RoomError } from './room.error.js';
import { safeName } from './room.validation.js';
import type { Connection, Room, RoomChange, RoomDeparture } from './room.types.js';

@Injectable()
export class RoomMembership {
  constructor(
    @Inject(ConnectionRegistry) private readonly connections: ConnectionRegistry,
    @Inject(RoomStore) private readonly rooms: RoomStore,
    @Inject(Scoreboard) private readonly scores: Scoreboard,
  ) {}

  create(connectionId: string, name: unknown, playerId?: unknown): RoomChange {
    const connection = this.availableConnection(connectionId, playerId);
    const room = this.rooms.create();
    this.addPlayer(room, connection, 'white', name);
    return { kind: 'update', room, event: 'room_created' };
  }
  join(connectionId: string, roomId: unknown, name: unknown, playerId?: unknown): RoomChange {
    const connection = this.availableConnection(connectionId, playerId);
    const id = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const room = this.rooms.find(id);
    if (!room) throw new RoomError('Комната не найдена или уже закрыта.', 'ROOM_NOT_FOUND');
    if (room.players.size === 2)
      throw new RoomError('Извините, но эта комната уже занята.', 'ROOM_FULL');
    this.addPlayer(room, connection, room.players.has('white') ? 'black' : 'white', name);
    return { kind: 'update', room, event: 'room_joined' };
  }
  leave(connectionId: string): RoomDeparture {
    const connection = this.connections.get(connectionId);
    const room = connection.roomId ? this.rooms.find(connection.roomId) : undefined;
    if (room) {
      for (const [color, player] of room.players)
        if (player.connectionId === connectionId) room.players.delete(color);
      room.offer = null;
      this.rooms.removeEmpty(room);
    }
    connection.roomId = undefined;
    return { kind: 'departure', room };
  }
  private availableConnection(id: string, playerId: unknown): Connection {
    const connection = this.connections.get(id);
    if (connection.roomId) throw new RoomError('Вы уже находитесь в комнате.');
    if (typeof playerId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(playerId))
      connection.playerId = playerId;
    return connection;
  }
  private addPlayer(room: Room, connection: Connection, color: Color, name: unknown): void {
    room.players.set(color, {
      id: connection.playerId,
      connectionId: connection.id,
      client: connection.client,
      name: safeName(name),
      color,
      wins: this.scores.forPlayer(connection.playerId),
    });
    connection.roomId = room.id;
  }
}

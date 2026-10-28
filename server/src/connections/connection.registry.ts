import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { WebSocket } from 'ws';
import type { Connection } from '../rooms/room.types.js';
import { RoomError } from '../rooms/room.error.js';

@Injectable()
export class ConnectionRegistry {
  private readonly connections = new Map<string, Connection>();
  private readonly socketIds = new WeakMap<WebSocket, string>();

  register(client: WebSocket, playerId: string = randomUUID()): Connection {
    const connection = { id: randomUUID(), playerId, client };
    this.connections.set(connection.id, connection);
    this.socketIds.set(client, connection.id);
    return connection;
  }
  get(id: string): Connection {
    const connection = this.connections.get(id);
    if (!connection) throw new RoomError('Соединение потеряно. Обновите страницу.');
    return connection;
  }
  forSocket(client: WebSocket): Connection | undefined {
    const id = this.socketIds.get(client);
    return id ? this.connections.get(id) : undefined;
  }
  remove(connection: Connection): void {
    this.connections.delete(connection.id);
    this.socketIds.delete(connection.client);
  }
}

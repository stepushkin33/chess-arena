import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ServerMessage } from '@chess/shared';
import type { WebSocket } from 'ws';
import { ConnectionRegistry } from '../connections/connection.registry.js';
import { RoomMembership } from '../rooms/room-membership.service.js';
import { RoomError } from '../rooms/room.error.js';
import { presentRoom } from '../rooms/room.presenter.js';
import type { Room, RoomChange, RoomCommandResult } from '../rooms/room.types.js';
import { MessageRateLimit, watchHeartbeat } from './socket-lifecycle.js';

/** Converts domain results into individual views for each socket; it makes no game decisions. */
@Injectable()
export class RoomSocketTransport {
  private readonly logger = new Logger(RoomSocketTransport.name);
  private readonly rateLimit = new MessageRateLimit();
  constructor(
    @Inject(ConnectionRegistry) private readonly connections: ConnectionRegistry,
    @Inject(RoomMembership) private readonly membership: RoomMembership,
  ) {}

  connect(client: WebSocket): void {
    const connection = this.connections.register(client);
    watchHeartbeat(client);
    this.send(client, { event: 'connected', data: { connectionId: connection.id } });
  }
  disconnect(client: WebSocket): void {
    const connection = this.connections.forSocket(client);
    if (!connection) return;
    const { room } = this.membership.leave(connection.id);
    this.connections.remove(connection);
    if (room) this.notifyDeparture(room);
  }
  execute(client: WebSocket, command: (id: string) => RoomCommandResult): void {
    try {
      if (!this.rateLimit.allows(client))
        throw new RoomError('Слишком много команд. Подождите несколько секунд.');
      const connection = this.connections.forSocket(client);
      if (!connection) throw new RoomError('Соединение потеряно. Обновите страницу.');
      const result = command(connection.id);
      if (result.kind === 'departure') {
        this.send(client, { event: 'room_left', data: {} });
        if (result.room) this.notifyDeparture(result.room);
      } else this.publish(result, connection.id);
    } catch (error) {
      if (!(error instanceof RoomError)) this.logger.error(error);
      this.send(client, {
        event: 'error',
        data:
          error instanceof RoomError
            ? { message: error.message, ...(error.code ? { code: error.code } : {}) }
            : { message: 'Не удалось выполнить действие. Попробуйте ещё раз.' },
      });
    }
  }
  private publish(change: RoomChange, senderId: string): void {
    for (const player of change.room.players.values()) {
      const entryEvent = change.event === 'room_created' || change.event === 'room_joined';
      const event = entryEvent && player.connectionId !== senderId ? 'room_state' : change.event;
      this.send(player.client, { event, data: presentRoom(change.room, player.connectionId) });
      if (change.notification?.connectionId === player.connectionId)
        this.send(player.client, { event: change.notification.event, data: {} });
    }
  }
  private notifyDeparture(room: Room): void {
    for (const player of room.players.values()) {
      this.send(player.client, {
        event: 'room_state',
        data: presentRoom(room, player.connectionId),
      });
      this.send(player.client, { event: 'opponent_left', data: {} });
    }
  }
  private send(client: WebSocket, message: ServerMessage): void {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  }
}

import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import { RoomMembership } from './rooms/room-membership.service.js';
import { RoomGame } from './rooms/room-game.service.js';
import { RoomOffers } from './rooms/room-offers.service.js';
import { RoomSocketTransport } from './transport/room-socket.transport.js';

/** Nest's entrypoint: event → use case. Validation and decisions belong to the services. */
@WebSocketGateway({ path: '/ws', maxPayload: 8192 })
export class ChessGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(RoomMembership) private readonly membership: RoomMembership,
    @Inject(RoomGame) private readonly game: RoomGame,
    @Inject(RoomOffers) private readonly offers: RoomOffers,
    @Inject(RoomSocketTransport) private readonly transport: RoomSocketTransport,
  ) {}
  handleConnection(client: WebSocket): void {
    this.transport.connect(client);
  }
  handleDisconnect(client: WebSocket): void {
    this.transport.disconnect(client);
  }

  @SubscribeMessage('create_room')
  create(@ConnectedSocket() client: WebSocket, @MessageBody() data: Record<string, unknown>): void {
    this.transport.execute(client, (id) => this.membership.create(id, data?.name, data?.playerId));
  }
  @SubscribeMessage('join_room')
  join(@ConnectedSocket() client: WebSocket, @MessageBody() data: Record<string, unknown>): void {
    this.transport.execute(client, (id) =>
      this.membership.join(id, data?.roomId, data?.name, data?.playerId),
    );
  }
  @SubscribeMessage('leave_room')
  leave(@ConnectedSocket() client: WebSocket): void {
    this.transport.execute(client, (id) => this.membership.leave(id));
  }
  @SubscribeMessage('move')
  move(@ConnectedSocket() client: WebSocket, @MessageBody() data: Record<string, unknown>): void {
    this.transport.execute(client, (id) => this.game.move(id, data?.move));
  }
  @SubscribeMessage('resign')
  resign(@ConnectedSocket() client: WebSocket): void {
    this.transport.execute(client, (id) => this.game.resign(id));
  }
  @SubscribeMessage('claim_draw')
  claimDraw(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Record<string, unknown>,
  ): void {
    this.transport.execute(client, (id) => this.game.claimDraw(id, data?.move));
  }
  @SubscribeMessage('offer_draw')
  offerDraw(@ConnectedSocket() client: WebSocket): void {
    this.transport.execute(client, (id) => this.offers.propose(id, 'draw'));
  }
  @SubscribeMessage('cancel_draw')
  cancelDraw(@ConnectedSocket() client: WebSocket): void {
    this.transport.execute(client, (id) => this.offers.cancelDraw(id));
  }
  @SubscribeMessage('respond_draw')
  respondDraw(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Record<string, unknown>,
  ): void {
    this.transport.execute(client, (id) => this.offers.respond(id, 'draw', data?.accept === true));
  }
  @SubscribeMessage('rematch')
  rematch(@ConnectedSocket() client: WebSocket): void {
    this.transport.execute(client, (id) => this.offers.propose(id, 'rematch'));
  }
  @SubscribeMessage('respond_rematch')
  respondRematch(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Record<string, unknown>,
  ): void {
    this.transport.execute(client, (id) =>
      this.offers.respond(id, 'rematch', data?.accept === true),
    );
  }
}

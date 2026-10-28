import { Module } from '@nestjs/common';
import { ChessGateway } from '../chess.gateway.js';
import { RoomSocketTransport } from '../transport/room-socket.transport.js';
import { ConnectionRegistry } from '../connections/connection.registry.js';
import { RoomStore } from './room.store.js';
import { RoomAccess } from './room.access.js';
import { RoomMembership } from './room-membership.service.js';
import { RoomGame } from './room-game.service.js';
import { RoomOffers } from './room-offers.service.js';
import { Scoreboard } from './scoreboard.service.js';

@Module({
  providers: [
    ConnectionRegistry,
    RoomStore,
    RoomAccess,
    Scoreboard,
    RoomMembership,
    RoomGame,
    RoomOffers,
    RoomSocketTransport,
    ChessGateway,
  ],
})
export class RoomsModule {}

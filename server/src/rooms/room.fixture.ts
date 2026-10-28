import type { WebSocket } from 'ws';
import { ConnectionRegistry } from '../connections/connection.registry.js';
import { RoomAccess } from './room.access.js';
import { RoomGame } from './room-game.service.js';
import { RoomMembership } from './room-membership.service.js';
import { RoomOffers } from './room-offers.service.js';
import { RoomStore } from './room.store.js';
import { Scoreboard } from './scoreboard.service.js';
import { presentRoom } from './room.presenter.js';

// Unit tests compose the same providers as RoomsModule, with no network or Nest bootstrap.
export function createMatch() {
  const connections = new ConnectionRegistry();
  const rooms = new RoomStore();
  const scores = new Scoreboard();
  const access = new RoomAccess(connections, rooms);
  const membership = new RoomMembership(connections, rooms, scores);
  const game = new RoomGame(access, scores);
  const offers = new RoomOffers(access);
  const connect = (playerId?: string) => connections.register({} as WebSocket, playerId);
  const white = connect('white-player');
  const black = connect('black-player');
  const { room } = membership.create(white.id, 'White');
  membership.join(black.id, room.id, 'Black');
  const opening = () => {
    game.move(white.id, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    game.move(black.id, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
  };
  return {
    connections,
    rooms,
    membership,
    game,
    offers,
    room,
    white,
    black,
    connect,
    opening,
    view: (id: string) => presentRoom(room, id),
  };
}

import type { GameState, Color, RoomStateEvent } from '@chess/shared';
import type { WebSocket } from 'ws';

export interface Player {
  id: string;
  connectionId: string;
  name: string;
  color: Color;
  wins: number;
  client: WebSocket;
}

export interface Room {
  id: string;
  state: GameState;
  players: Map<Color, Player>;
  createdAt: number;
  resultAwarded: boolean;
  offer: RoomOffer | null;
}

export type OfferKind = 'draw' | 'rematch';
export interface RoomOffer {
  kind: OfferKind;
  fromConnectionId: string;
}
export type RoomChange = {
  kind: 'update';
  room: Room;
  event: RoomStateEvent;
  notification?: { connectionId: string; event: 'draw_declined' | 'rematch_declined' };
};
export type RoomDeparture = { kind: 'departure'; room?: Room };
export type RoomCommandResult = RoomChange | RoomDeparture;

export interface Connection {
  id: string;
  playerId: string;
  client: WebSocket;
  roomId?: string;
}

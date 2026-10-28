import type { Color, GameState, Move } from './chess/types.js';

export interface PlayerView {
  id: string;
  name: string;
  color: Color;
  wins: number;
}
export interface RoomView {
  roomId: string;
  inviteUrl: string;
  state: GameState;
  you: PlayerView;
  opponent: PlayerView | null;
  playersCount: number;
  rematchRequested: boolean;
  rematchOfferFrom: PlayerView | null;
  rematchOfferPending: boolean;
  drawOfferFrom: PlayerView | null;
  drawOfferPending: boolean;
}
export type ClientCommand =
  | { event: 'create_room'; data: { name: string; playerId: string } }
  | { event: 'join_room'; data: { roomId: string; name: string; playerId: string } }
  | { event: 'move'; data: { move: Move } }
  | { event: 'respond_draw' | 'respond_rematch'; data: { accept: boolean } }
  | { event: 'claim_draw'; data: { move?: Move } }
  | {
      event: 'leave_room' | 'resign' | 'offer_draw' | 'cancel_draw' | 'rematch';
      data?: Record<string, never>;
    };
export type RoomStateEvent = 'room_created' | 'room_joined' | 'room_state' | 'game_state';
export type RoomErrorCode = 'ROOM_FULL' | 'ROOM_NOT_FOUND';
export type ServerMessage =
  | { event: RoomStateEvent; data: RoomView }
  | { event: 'connected'; data: { connectionId: string } }
  | { event: 'error'; data: { message: string; code?: RoomErrorCode } }
  | {
      event: 'room_left' | 'opponent_left' | 'draw_declined' | 'rematch_declined';
      data: Record<string, never>;
    };

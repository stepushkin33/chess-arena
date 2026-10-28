import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { createInitialState } from '@chess/shared';
import type { Room } from './room.types.js';

/** Rooms belong to one process; there is no implicit persistence or replication. */
@Injectable()
export class RoomStore {
  private readonly rooms = new Map<string, Room>();

  create(): Room {
    let id: string;
    do {
      id = randomBytes(3).toString('hex').toUpperCase();
    } while (this.rooms.has(id));
    const room: Room = {
      id,
      state: createInitialState(),
      players: new Map(),
      createdAt: Date.now(),
      resultAwarded: false,
      offer: null,
    };
    this.rooms.set(id, room);
    return room;
  }
  find(id: string): Room | undefined {
    return this.rooms.get(id);
  }
  removeEmpty(room: Room): void {
    if (room.players.size === 0) this.rooms.delete(room.id);
  }
}

import { Injectable } from '@nestjs/common';
import type { Room } from './room.types.js';

@Injectable()
export class Scoreboard {
  private readonly wins = new Map<string, number>();
  forPlayer(playerId: string): number {
    return this.wins.get(playerId) ?? 0;
  }

  awardWinner(room: Room): void {
    if (!room.state.winner || room.resultAwarded) return;
    const winner = room.players.get(room.state.winner);
    if (!winner) return;
    winner.wins = this.forPlayer(winner.id) + 1;
    this.wins.set(winner.id, winner.wins);
    room.resultAwarded = true;
  }
}

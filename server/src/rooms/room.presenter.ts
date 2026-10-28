import type { PlayerView, RoomView } from '@chess/shared';
import type { Player, Room } from './room.types.js';

const presentPlayer = (player: Player): PlayerView => ({
  id: player.id,
  name: player.name,
  color: player.color,
  wins: player.wins,
});
export const playerForConnection = (room: Room, connectionId: string): Player | undefined =>
  [...room.players.values()].find((player) => player.connectionId === connectionId);

/** Never serialize sockets or internal connection IDs into the public room view. */
export const presentRoom = (room: Room, connectionId: string): RoomView => {
  const you = playerForConnection(room, connectionId);
  if (!you) throw new Error('Игрок не найден в комнате.');
  const opponent = [...room.players.values()].find(
    (player) => player.connectionId !== connectionId,
  );
  const offerer = room.offer ? playerForConnection(room, room.offer.fromConnectionId) : undefined;
  const drawOfferer = room.offer?.kind === 'draw' ? offerer : undefined;
  const rematchOfferer = room.offer?.kind === 'rematch' ? offerer : undefined;
  return {
    roomId: room.id,
    inviteUrl: `/room/${room.id}`,
    state: room.state,
    you: presentPlayer(you),
    opponent: opponent ? presentPlayer(opponent) : null,
    playersCount: room.players.size,
    rematchRequested: rematchOfferer === you,
    rematchOfferFrom:
      rematchOfferer && rematchOfferer !== you ? presentPlayer(rematchOfferer) : null,
    rematchOfferPending: rematchOfferer === you,
    drawOfferFrom: drawOfferer && drawOfferer !== you ? presentPlayer(drawOfferer) : null,
    drawOfferPending: drawOfferer === you,
  };
};

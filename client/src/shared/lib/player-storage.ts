const NAME_KEY = 'chess-arena-name';
const PLAYER_KEY = 'chess-arena-player-id';

export const storedName = (): string => localStorage.getItem(NAME_KEY) ?? 'Игрок';
export const saveName = (name: string): void => localStorage.setItem(NAME_KEY, name);

export function playerId(): string {
  const stored = localStorage.getItem(PLAYER_KEY);
  if (stored) return stored;
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem(PLAYER_KEY, id);
  return id;
}

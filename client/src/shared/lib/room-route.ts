export function readRoomRoute(): string | null {
  const query = new URLSearchParams(location.search).get('room');
  const path = location.pathname.match(/^\/room\/([a-z0-9]{6})\/?$/i)?.[1];
  const roomId = (query ?? path ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(roomId) ? roomId : null;
}

export function navigateToRoom(roomId: string): void {
  const path = `/room/${roomId}`;
  if (location.pathname !== path) history.pushState({}, '', path);
}

export function navigateToLobby(): void {
  if (location.pathname !== '/' || location.search) history.pushState({}, '', '/');
}

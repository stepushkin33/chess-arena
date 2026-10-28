import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@chess/shared';

export function useRoomInvite(room: RoomView | null) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const share = async (): Promise<void> => {
    if (!room) return;
    const url = `${location.origin}${room.inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chess Arena',
          text: 'Присоединяйся к шахматной партии.',
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Скопируйте ссылку приглашения:', url);
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };
  return { copied, share };
}

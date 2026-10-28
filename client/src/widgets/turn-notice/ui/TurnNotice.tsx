import { useEffect, useRef, useState } from 'react';
import { useActiveRoom } from '../../../entities/session/model/SessionProvider';

export function TurnNotice(): JSX.Element | null {
  const room = useActiveRoom();
  const previous = useRef(room);
  const timer = useRef<number>();
  const [message, setMessage] = useState('');
  useEffect(() => {
    const was = previous.current;
    previous.current = room;
    const started = was.playersCount < 2 && room.playersCount === 2;
    const changedTurn = was.state.turn !== room.state.turn;
    if ((started || changedTurn) && room.state.status === 'playing' && room.playersCount === 2) {
      setMessage(room.state.turn === room.you.color ? 'Ваш ход' : 'Ход соперника');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(''), 2200);
    }
    if (room.state.status !== 'playing') setMessage('');
  }, [room]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return message ? (
    <div className="turn-toast" role="status">
      {message}
    </div>
  ) : null;
}

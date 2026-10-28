import { useActiveRoom } from '../../../entities/session/model/SessionProvider';
import { useRoomInvite } from '../model/useRoomInvite';

export function RoomInvitation(): JSX.Element {
  const room = useActiveRoom();
  const invite = useRoomInvite(room);
  return (
    <div className="sidebar-card invite-card">
      <div className="sidebar-title">
        <span>ЖДЁМ СОПЕРНИКА</span>
        <span className="room-code-label">{room.roomId}</span>
      </div>
      <div className="invite-card-body">
        <p>Отправьте приглашение — ссылка уже готова.</p>
        <button className="primary-button" type="button" onClick={invite.share}>
          {invite.copied ? 'Ссылка скопирована' : 'Отправить приглашение'} <span>↗</span>
        </button>
      </div>
    </div>
  );
}

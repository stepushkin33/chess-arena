import { useRoomEntry } from '../model/useRoomEntry';
import { useSessionState } from '../../../entities/session/model/SessionProvider';
import { PlayerNameModal } from './PlayerNameModal';

export function RoomEntry(): JSX.Element {
  const entry = useRoomEntry();
  const { connected } = useSessionState();
  return (
    <>
      <div className="lobby-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!connected}
          onClick={entry.create}
        >
          Создать комнату <span>↗</span>
        </button>
        <div className="divider">
          <span>или войдите по приглашению</span>
        </div>
        <form
          className="join-form"
          onSubmit={(event) => {
            event.preventDefault();
            entry.join();
          }}
        >
          <input
            className="text-input room-input"
            aria-label="Код комнаты"
            placeholder="Код комнаты"
            value={entry.roomCode}
            onChange={(event) => entry.setRoomCode(event.target.value.toUpperCase())}
            maxLength={6}
          />
          <button
            className="secondary-button"
            type="submit"
            disabled={!connected || !/^[A-Z0-9]{6}$/.test(entry.roomCode)}
          >
            Войти
          </button>
        </form>
      </div>
      <PlayerNameModal
        open={entry.askingName}
        initialName={entry.name}
        title={entry.creating ? 'Как вас представить?' : 'Введите имя для партии'}
        onSubmit={entry.confirmName}
        onCancel={entry.cancel}
      />
    </>
  );
}

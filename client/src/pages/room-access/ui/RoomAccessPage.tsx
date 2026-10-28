import {
  useSessionActions,
  useSessionState,
} from '../../../entities/session/model/SessionProvider';

export function RoomAccessPage(): JSX.Element {
  const { accessError } = useSessionState();
  const { leave } = useSessionActions();
  const full = accessError === 'full';
  return (
    <main className="app-shell lobby-shell access-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="access-card">
        <div className="access-icon">{full ? '♟' : '?'}</div>
        <p className="eyebrow">CHESS ARENA · PRIVATE ROOM</p>
        <h1>{full ? 'Извините, но эта комната уже занята' : 'Комната не найдена'}</h1>
        <p className="lobby-copy">
          {full
            ? 'В комнате могут играть только два человека. Попросите друга создать новую ссылку.'
            : 'Проверьте ссылку или попросите соперника создать новую комнату.'}
        </p>
        <button className="primary-button" type="button" onClick={leave}>
          На стартовый экран <span>↗</span>
        </button>
      </section>
    </main>
  );
}

import { RoomEntry } from '../../../features/room-entry/ui/RoomEntry';
import { ConnectionStatus, SessionNotice } from '../../../entities/session/ui/ConnectionStatus';

export function LobbyPage(): JSX.Element {
  return (
    <main className="app-shell lobby-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="lobby-card">
        <div className="brand-mark">♞</div>
        <p className="eyebrow">CHESS ARENA · ONLINE</p>
        <h1>
          Матч начинается
          <br />
          <span>с одного хода.</span>
        </h1>
        <p className="lobby-copy">Создайте приватную комнату и поделитесь ссылкой с соперником.</p>
        <RoomEntry />
        <ConnectionStatus />
        <SessionNotice />
      </section>
      <footer className="lobby-footer">
        <span>♜</span> Шахматы без отвлечений
      </footer>
    </main>
  );
}

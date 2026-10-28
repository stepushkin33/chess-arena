import { useSessionState } from '../model/SessionProvider';

export function ConnectionStatus(): JSX.Element {
  const { connected } = useSessionState();
  return (
    <div className="connection-status" role="status">
      <span className={connected ? 'status-dot online' : 'status-dot'} />
      {connected ? 'На связи' : 'Подключаемся к игре…'}
    </div>
  );
}

export function SessionNotice(): JSX.Element | null {
  const { connected, notice } = useSessionState();
  const message = connected ? notice : 'Восстанавливаем соединение…';
  return message ? (
    <p className="notice error-notice" role="status">
      {message}
    </p>
  ) : null;
}

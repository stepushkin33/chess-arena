import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../../../shared/ui/Modal';

interface PlayerNameModalProps {
  open: boolean;
  initialName: string;
  title: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function PlayerNameModal({
  open,
  initialName,
  title,
  onSubmit,
  onCancel,
}: PlayerNameModalProps): JSX.Element {
  const [value, setValue] = useState(initialName);
  useEffect(() => {
    if (open) setValue(initialName);
  }, [initialName, open]);
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const normalized = value.trim().slice(0, 20);
    if (normalized) onSubmit(normalized);
  };
  return (
    <Modal open={open} title={title} className="name-modal" onClose={onCancel}>
      <p className="modal-copy">Соперник увидит это имя в комнате.</p>
      <form onSubmit={submit}>
        <label className="field-label" htmlFor="room-player-name">
          Имя игрока
        </label>
        <input
          id="room-player-name"
          className="text-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={20}
        />
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>
            Отмена
          </button>
          <button className="primary-button" type="submit" disabled={!value.trim()}>
            Продолжить <span>↗</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

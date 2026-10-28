import { Modal } from '../../../shared/ui/Modal';

interface DrawClaimModalProps {
  open: boolean;
  onClaim: () => void;
  onPlay: () => void;
  onCancel: () => void;
}

export function DrawClaimModal({
  open,
  onClaim,
  onPlay,
  onCancel,
}: DrawClaimModalProps): JSX.Element {
  return (
    <Modal
      open={open}
      title="Этот ход даёт право заявить ничью"
      className="draw-offer-modal"
      onClose={onCancel}
    >
      <p className="modal-copy">
        Позиция повторится трижды или будет выполнено правило 50 ходов. Можно заявить ничью с этим
        ходом либо продолжить партию.
      </p>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onPlay}>
          Сделать ход
        </button>
        <button className="primary-button" onClick={onClaim}>
          Заявить ничью
        </button>
      </div>
      <button className="ghost-button" onClick={onCancel}>
        Отмена
      </button>
    </Modal>
  );
}

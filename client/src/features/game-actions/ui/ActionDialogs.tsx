import { Modal } from '../../../shared/ui/Modal';
import type { ConfirmedAction, OfferKind } from '../model/useGameActions';

export function ConfirmActionDialog({
  action,
  onConfirm,
  onCancel,
}: {
  action: ConfirmedAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}): JSX.Element {
  const resigning = action === 'resign';
  return (
    <Modal
      open={Boolean(action)}
      title={resigning ? 'Сдаться в этой партии?' : 'Предложить ничью?'}
      className="confirmation-modal"
      onClose={onCancel}
    >
      <p className="modal-copy">
        {resigning
          ? 'Партия завершится. Соперник получит победу, если у него достаточно материала для мата.'
          : 'Соперник сможет принять или отклонить предложение. До ответа ходы будут приостановлены.'}
      </p>
      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel}>
          Отмена
        </button>
        <button
          className={`primary-button ${resigning ? 'danger-confirm-button' : ''}`}
          onClick={onConfirm}
        >
          {resigning ? 'Сдаться' : 'Предложить ничью'}
        </button>
      </div>
    </Modal>
  );
}

export function IncomingOfferDialog({
  kind,
  opponentName,
  disabled,
  onRespond,
}: {
  kind: OfferKind | null;
  opponentName: string;
  disabled: boolean;
  onRespond: (accept: boolean) => void;
}): JSX.Element {
  const draw = kind === 'draw';
  return (
    <Modal
      open={Boolean(kind)}
      title={`${opponentName} предлагает ${draw ? 'ничью' : 'сыграть ещё раз'}`}
      className="draw-offer-modal"
    >
      <p className="modal-copy">
        {draw
          ? 'Партия завершится ничьёй после вашего согласия.'
          : 'Начнётся новая партия. Общий счёт сохранится.'}
      </p>
      <div className="modal-actions">
        <button className="ghost-button" disabled={disabled} onClick={() => onRespond(false)}>
          Нет
        </button>
        <button className="primary-button" disabled={disabled} onClick={() => onRespond(true)}>
          {draw ? 'Да, ничья' : 'Да, сыграть'}
        </button>
      </div>
    </Modal>
  );
}
